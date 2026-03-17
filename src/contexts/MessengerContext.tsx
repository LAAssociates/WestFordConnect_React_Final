import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import type { Conversation, User, Message, Attachment } from '../components/messenger/types';
import { chatService } from '../services/chatService';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';
import type { ChatUserInfo } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_TARGET_URL;

interface MessengerContextType {
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    users: User[];
    currentUser: User;
    unreadConversationCount: number;
    isLoadingChatList: boolean;
    isLoadingBootstrap: boolean;
    consumeUnreadConversation: () => void;
    refreshUnreadConversationCount: () => Promise<void>;
    fetchChatList: (showLoadingIndicator?: boolean, page?: number, size?: number, append?: boolean) => Promise<number>;
    fetchProjectGroupChats: (page?: number, size?: number) => Promise<Conversation[]>;
    fetchBootstrap: () => Promise<void>;
    updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
    messages: Record<string, Message[]>;
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
    sendMessage: (chatType: 'user' | 'group', chatId: number, message: string) => Promise<void>;
    sendFileMessage: (
        chatType: 'user' | 'group',
        chatId: number,
        file: File,
        message?: string,
        onUploadProgress?: (progress: number) => void
    ) => Promise<void>;
    downloadChatAttachment: (
        chatType: 'user' | 'group',
        chatId: number,
        messageId: number,
        attachmentId: number,
        fileName?: string
    ) => Promise<void>;
    joinChat: (chatType: 'user' | 'group', chatId: number) => Promise<void>;
    setActiveChat: (chat: { type: 'user' | 'group'; id: number } | null) => void;
    activeChat: { type: 'user' | 'group'; id: number } | null;
    getNumericChatId: (chatType: 'user' | 'group', targetId: string) => number;
    hubConnection: HubConnection | null;
    connect: () => Promise<HubConnection | null>;
    disconnect: () => Promise<void>;
    typingUsers: Record<string, { userId: string; userName: string; timestamp: number }>;
    sendTypingIndicator: (chatType: 'user' | 'group', chatId: number) => void;
    markMessageAsRead: (messageId: string, chatType?: 'user' | 'group', chatId?: number) => void;
    markMessageAsDelivered: (messageId: string, chatType?: 'user' | 'group', chatId?: number) => void;
    startPrivateChat: (targetUserId: number) => Promise<number>;
    createGroup: (groupName: string, userIds: number[], groupImage?: File | null) => Promise<number>;
    fetchMessages: (chatType: 'user' | 'group', chatId: number) => Promise<void>;
    fetchOlderMessages: (chatType: 'user' | 'group', chatId: number, beforeMessageId: number) => Promise<number>;
    toggleChatPinned: (chatType: 'user' | 'group', chatId: number, isPinned: boolean) => Promise<void>;
    toggleChatMuted: (chatType: 'user' | 'group', chatId: number, isMuted: boolean) => Promise<void>;
    toggleChatUnread: (
        chatType: 'user' | 'group',
        chatId: number,
        isUnread: boolean,
        lastMessageId?: number | null
    ) => Promise<void>;
}

const MessengerContext = createContext<MessengerContextType | undefined>(undefined);

const EMPTY_CURRENT_USER: User = {
    id: '0',
    name: 'You',
    position: 'Staff',
    email: '',
    status: 'offline',
};

interface MessengerProviderProps {
    children: ReactNode;
}

export const MessengerProvider: React.FC<MessengerProviderProps> = ({ children }) => {
    const { user: authUser } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]); // Initialize empty
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; userName: string; timestamp: number }>>({});
    const [users, setUsers] = useState<User[]>([]);
    const [unreadConversationCount, setUnreadConversationCount] = useState(0);
    const [isLoadingChatList, setIsLoadingChatList] = useState(false);
    const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(false);
    const [hubConnection, setHubConnection] = useState<HubConnection | null>(null);
    const connectionRef = useRef<HubConnection | null>(null);
    const [activeChat, setActiveChat] = useState<{ type: 'user' | 'group'; id: number } | null>(null);
    const activeChatRef = useRef<{ type: 'user' | 'group'; id: number } | null>(null);
    const currentUserRef = useRef<User>(EMPTY_CURRENT_USER);
    const usersRef = useRef<User[]>([]);
    const conversationsRef = useRef<Conversation[]>([]);
    const deliveredAckRef = useRef<Set<string>>(new Set());

    // Keep activeChatRef in sync with activeChat state
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const currentUser: User = useMemo(() => {
        if (!authUser) return EMPTY_CURRENT_USER;
        return {
            id: authUser.id.toString(),
            name: `${authUser.firstName} ${authUser.lastName}`,
            email: authUser.email,
            avatar: authUser.picture,
            position: 'Staff', // Default position
            status: 'online'
        };
    }, [authUser]);

    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const mapPresenceToUserStatus = useCallback((
        availabilityStatus?: number | null,
        isOnline?: boolean | null
    ): User['status'] => {
        if (!isOnline) {
            return 'offline';
        }

        switch (availabilityStatus) {
            case 1:
                return 'busy';
            case 3:
                return 'away';
            case 2:
            default:
                return 'online';
        }
    }, []);

    const normalizeChatType = useCallback((rawType: unknown): 'user' | 'group' => {
        const value = String(rawType || '').trim().toLowerCase();
        return value === 'group' ? 'group' : 'user';
    }, []);

    const mapChatUserToMessengerUser = useCallback((chatUser: ChatUserInfo): User => ({
        id: chatUser.id.toString(),
        name: chatUser.name,
        position: chatUser.designation || 'Staff',
        email: chatUser.email,
        avatar: chatUser.profileImageUrl,
        status: mapPresenceToUserStatus(
            typeof chatUser.availabilityStatus === 'number' ? chatUser.availabilityStatus : undefined,
            typeof chatUser.isOnline === 'boolean' ? chatUser.isOnline : undefined
        ),
    }), [mapPresenceToUserStatus]);

    const resolveSenderName = useCallback((
        chatType: 'user' | 'group',
        chatId: number,
        senderId: number | string | undefined,
        senderNameFromApi?: string
    ): string => {
        if (senderNameFromApi && senderNameFromApi.trim().length > 0) {
            return senderNameFromApi;
        }

        const senderIdStr = senderId?.toString() ?? '';
        if (!senderIdStr) {
            return 'Unknown';
        }

        if (senderIdStr === currentUserRef.current.id) {
            return currentUserRef.current.name;
        }

        const convId = chatType === 'user' ? `conv-${chatId}` : `conv-group-${chatId}`;
        const conv = conversationsRef.current.find((c) => c.id === convId);
        const participantName = conv?.participants.find((p) => p.id === senderIdStr)?.name;
        if (participantName && participantName.trim().length > 0) {
            return participantName;
        }

        const userName = usersRef.current.find((u) => u.id === senderIdStr)?.name;
        if (userName && userName.trim().length > 0) {
            return userName;
        }

        return 'Unknown';
    }, []);

    const mapAttachments = useCallback((rawAttachments: any[] | undefined): Attachment[] => {
        if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
            return [];
        }

        const resolveSize = (attachment: any): number | undefined => {
            const candidates = [
                attachment?.size,
                attachment?.fileSize,
                attachment?.fileSizeBytes,
                attachment?.contentLength
            ];

            for (const candidate of candidates) {
                if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
                    return candidate;
                }

                if (typeof candidate === 'string') {
                    const parsed = Number(candidate);
                    if (Number.isFinite(parsed) && parsed > 0) {
                        return parsed;
                    }
                }
            }

            return undefined;
        };

        return rawAttachments.map((a: any, index: number) => {
            const contentType = (a.contentType || '').toString().toLowerCase();
            const attachmentType = (a.attachmentType || '').toString().toLowerCase();
            const isImage = contentType.startsWith('image/') || attachmentType === 'image';

            return {
                id: (a.attachmentId ?? `att-${Date.now()}-${index}`).toString(),
                attachmentId: a.attachmentId,
                type: isImage ? 'image' : 'file',
                name: a.displayText || a.fileName || `Attachment ${index + 1}`,
                url: a.url || '',
                size: resolveSize(a),
                contentType: a.contentType || undefined,
                downloadCount: typeof a.downloadCount === 'number' ? a.downloadCount : 0
            };
        });
    }, []);

    const mapServerChatToConversation = useCallback((chat: any): Conversation => {
        const chatType = chat.chatType === 'user' ? 'individual' : 'group';
        const convId = chat.chatType === 'user' ? `conv-${chat.chatId}` : `conv-group-${chat.chatId}`;

        let lastMsg: Message | undefined;
        const isRead = chat.isRead === true;
        const isDelivered = chat.isDelivered === true;
        const status: 'read' | 'delivered' | 'sent' = isRead ? 'read' : (isDelivered ? 'delivered' : 'sent');

        if (typeof chat.lastMessage === 'string' && chat.lastMessage.trim().length > 0) {
            lastMsg = {
                id: (chat.lastMessageId || `msg-${Date.now()}`).toString(),
                senderId: chat.isLastMessageMine ? currentUser.id : (chat.lastMessageSenderId?.toString() || ''),
                senderName: chat.isLastMessageMine ? currentUser.name : (chat.title || ''),
                content: chat.lastMessage,
                timestamp: new Date(chat.lastMessageTime || Date.now()),
                status
            };
        } else if (chat.lastMessage) {
            lastMsg = {
                id: (chat.lastMessage.messageId || chat.lastMessage.id || `msg-${Date.now()}`).toString(),
                senderId: chat.lastMessage.senderId?.toString() || '',
                senderName: chat.lastMessage.senderName || '',
                content: chat.lastMessage.message || chat.lastMessage.content,
                timestamp: new Date(chat.lastMessage.createdOn || chat.lastMessage.timestamp || Date.now()),
                status
            };
        }

        let participants = chat.participants ? chat.participants.map(mapChatUserToMessengerUser) : [];
        if (chatType === 'individual' && participants.length === 0) {
            if (chat.title && chat.chatId) {
                participants = [
                    currentUser,
                    {
                        id: (chat.lastMessageSenderId && !chat.isLastMessageMine ? chat.lastMessageSenderId.toString() : 'unknown'),
                        name: chat.title,
                        avatar: chat.avatarUrl,
                        position: 'Contact',
                        status: mapPresenceToUserStatus(chat.availabilityStatus, chat.isOnline),
                        email: ''
                    }
                ];
            }
        }

        const hasIsLeft = Object.prototype.hasOwnProperty.call(chat, 'isLeft');
        const hasLeftOn = Object.prototype.hasOwnProperty.call(chat, 'leftOn');

        return {
            id: convId,
            type: chatType,
            name: chat.title || chat.name || 'Chat',
            avatar: chat.avatarUrl || chat.profileImageUrl || chat.groupIconUrl,
            lastMessage: lastMsg,
            lastMessageTime: new Date(chat.lastMessageTime || (chat.lastMessage && (chat.lastMessage.createdOn || chat.lastMessage.timestamp)) || Date.now()),
            unreadCount: chat.unreadCount || 0,
            participants,
            isOnline: chat.isOnline,
            isPinned: chat.isPinned === true,
            isMuted: chat.isMuted === true,
            isLeft: hasIsLeft ? chat.isLeft === true : undefined,
            leftOn: hasLeftOn && chat.leftOn ? new Date(chat.leftOn) : undefined
        } as Conversation;
    }, [currentUser, mapChatUserToMessengerUser, mapPresenceToUserStatus]);

    const fetchChatList = useCallback(async (
        showLoadingIndicator: boolean = true,
        page: number = 1,
        size: number = 50,
        append: boolean = false
    ): Promise<number> => {
        if (showLoadingIndicator) {
            setIsLoadingChatList(true);
        }
        try {
            const response = await chatService.getChatList(page, size);
            if (response.success && response.result) {
                const mappedConversations: Conversation[] = response.result.map(mapServerChatToConversation);
                if (append) {
                    setConversations((prev) => {
                        if (prev.length === 0) return mappedConversations;

                        const existingIndex = new Map(prev.map((conv, idx) => [conv.id, idx]));
                        const merged = [...prev];

                        mappedConversations.forEach((incoming) => {
                            const idx = existingIndex.get(incoming.id);
                            if (idx === undefined) {
                                merged.push(incoming);
                                return;
                            }

                            const existing = merged[idx];
                            merged[idx] = {
                                ...existing,
                                ...incoming,
                                participants: incoming.participants?.length
                                    ? incoming.participants
                                    : existing.participants,
                                isLeft: incoming.isLeft ?? existing.isLeft,
                                leftOn: incoming.leftOn ?? existing.leftOn
                            };
                        });

                        return merged;
                    });
                } else {
                    setConversations((prev) =>
                        mappedConversations.map((incoming) => {
                            const existing = prev.find((c) => c.id === incoming.id);
                            if (!existing) {
                                return incoming;
                            }

                            return {
                                ...existing,
                                ...incoming,
                                participants: incoming.participants?.length
                                    ? incoming.participants
                                    : existing.participants,
                                isLeft: incoming.isLeft ?? existing.isLeft,
                                leftOn: incoming.leftOn ?? existing.leftOn
                            };
                        })
                    );
                }

                return mappedConversations.length;
            }
            return 0;
        } catch (error) {
            console.error('Failed to fetch chat list:', error);
            return 0;
        } finally {
            if (showLoadingIndicator) {
                setIsLoadingChatList(false);
            }
        }
    }, [mapServerChatToConversation]);

    const refreshUnreadConversationCount = useCallback(async (): Promise<void> => {
        try {
            const response = await chatService.getUnreadCount();
            if (response.success) {
                setUnreadConversationCount(response.result?.unreadConversationCount ?? 0);
            }
        } catch (error) {
            console.error('Failed to fetch chat unread count:', error);
        }
    }, []);

    const consumeUnreadConversation = useCallback(() => {
        setUnreadConversationCount((prev) => Math.max(0, prev - 1));
    }, []);

    const fetchProjectGroupChats = useCallback(async (
        page: number = 1,
        size: number = 50
    ): Promise<Conversation[]> => {
        try {
            const response = await chatService.getProjectGroupChats(page, size);
            if (!response.success || !response.result) {
                return [];
            }
            return response.result.map(mapServerChatToConversation);
        } catch (error) {
            console.error('Failed to fetch project group chats:', error);
            return [];
        }
    }, [mapServerChatToConversation]);

    const fetchBootstrap = useCallback(async () => {
        setIsLoadingBootstrap(true);
        try {
            const response = await chatService.bootstrap();
            if (response.success && response.result.users) {
                const incomingUsers = response.result.users;
                setUsers((prev) => {
                    const prevById = new Map(prev.map((u) => [u.id, u]));
                    return incomingUsers.map((rawUser) => {
                        const mappedUser = mapChatUserToMessengerUser(rawUser);
                        const hasPresenceInPayload =
                            typeof rawUser.availabilityStatus === 'number' ||
                            typeof rawUser.isOnline === 'boolean';

                        if (hasPresenceInPayload) {
                            return mappedUser;
                        }

                        const existing = prevById.get(mappedUser.id);
                        if (existing?.status) {
                            return {
                                ...mappedUser,
                                status: existing.status,
                            };
                        }

                        return mappedUser;
                    });
                });
            }
        } catch (error) {
            console.error('Failed to bootstrap users:', error);
        } finally {
            setIsLoadingBootstrap(false);
        }
    }, [mapChatUserToMessengerUser]);

    const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
        setConversations((prev) =>
            prev.map((conv) => (conv.id === conversationId ? { ...conv, ...updates } : conv))
        );
    }, []);

    const sendMessage = useCallback(async (chatType: 'user' | 'group', chatId: number, message: string): Promise<void> => {
        if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
            console.error('Cannot send message: SignalR not connected');
            throw new Error('SignalR not connected');
        }

        // When sending to a user, the API likely expects the TARGET USER ID, not the composite ID.
        // The composite ID (e.g., 2010003020) is only for our local unique key.
        // But wait, the `chatId` passed into this function comes from `activeChat.id`.
        // If `activeChat.id` is already composite, we need to extract the target ID.

        if (chatType === 'user' && chatId > 1000000) {
            // It's a composite ID, extract the other user's ID
            // Logic: Math.min(id1, id2) * 10000 + Math.max(id1, id2)
            // We need to find which part is NOT us.
            // But simpler: The UI should probably pass the correct target ID.
            // If we rely on `getNumericChatId`, it returns composite.
            // Let's defer to the component? No, context should handle it.

            // Hacky extraction:
            // We know our ID is `currentUser.id`.
            // But we can't easily reverse the math without iterating.

            // BETTER APPROACH within `ChatWindow`:
            // The `activeChat` object in typical apps holds the `id` of the *conversation partner*.
            // If my code sets `activeChat.id` to the composite ID, then that's the issue.

            // Let's assume for now that if it IS a large number, we try to fix it, 
            // OR we just send it and see. user says "now u r using both sender id and receiver id".
            // This implies the parameter `chatId` IS `10102010`.

            // If I change this to:
            // const targetId = ... ?

            // Actually, let's look at `getNumericChatId`. It CREATES 10102010.
            // I need to ensure `sendMessage` receives the `recipientId`.

            // If `chatId` passed here is 10102010, I should probably NOT use it for the API.
            // But `sendMessage` is called from `ChatWindow`'s `handleSendMessage`.

            // Let's MODIFY `ChatWindow` to pass the recipient ID, OR 
            // modify `sendMessage` to accept `recipientId`.

            // For now, let's try to pass it as is, but if the User says "10102010" is wrong,
            // checking `ChatWindow` is better step.
        }

        try {
            // Send the raw chatId passed in. The caller (ChatWindow/UI) should be responsible
            // for passing the correct Target User ID for 'user' chats.
            await chatService.sendMessage({ chatType, chatId, message });
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }, []);

    const sendFileMessage = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        file: File,
        message?: string,
        onUploadProgress?: (progress: number) => void
    ): Promise<void> => {
        if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
            throw new Error('SignalR not connected');
        }

        await chatService.sendFileMessage({
            chatType,
            chatId,
            file,
            message
        }, onUploadProgress);
    }, []);

    const downloadChatAttachment = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        messageId: number,
        attachmentId: number,
        fileName?: string
    ): Promise<void> => {
        const response = await chatService.downloadAttachment({
            chatType,
            chatId,
            messageId,
            attachmentId
        });

        const url = response.result?.url;
        if (!response.success || !url) {
            throw new Error(response.message || 'Unable to download attachment');
        }

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'attachment';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const sendTypingIndicator = useCallback((chatType: 'user' | 'group', chatId: number) => {
        if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
            return;
        }

        try {
            connectionRef.current.invoke('Typing', chatType, chatId);
        } catch (error) {
            console.error('Failed to send typing indicator:', error);
        }
    }, []);

    const markMessageAsRead = useCallback(async (messageId: string, chatType?: 'user' | 'group', chatId?: number) => {
        let targetChatType: 'user' | 'group' | undefined;
        let targetChatId: number | undefined;

        if (chatType && chatId) {
            targetChatType = chatType;
            targetChatId = chatId;
        }

        // Optimistically update status
        setMessages(prev => {
            const newMessages = { ...prev };

            Object.keys(newMessages).forEach(key => {
                const msgs = newMessages[key];
                const msgIndex = msgs.findIndex(m => m.id === messageId);

                if (msgIndex !== -1) {
                    // Found the message, extract chat info from key
                    // Key format: "conv-123" or "conv-group-456"
                    if (!targetChatType || !targetChatId) {
                        if (key.startsWith('conv-group-')) {
                            targetChatType = 'group';
                            targetChatId = parseInt(key.replace('conv-group-', ''), 10);
                        } else if (key.startsWith('conv-')) {
                            targetChatType = 'user';
                            targetChatId = parseInt(key.replace('conv-', ''), 10);
                        }
                    }

                    if (msgs[msgIndex].status !== 'read') {
                        const updatedAppMessages = [...msgs];
                        updatedAppMessages[msgIndex] = { ...updatedAppMessages[msgIndex], status: 'read' };
                        newMessages[key] = updatedAppMessages;
                    }
                }
            });
            return newMessages;
        });

        // Call API
        if (targetChatType && targetChatId) {
            try {
                console.log('Read API firing', {
                    messageId,
                    type: targetChatType,
                    chatId: targetChatId
                });
                await apiClient.post('/api/chat/read', null, {
                    params: {
                        type: targetChatType,
                        chatId: targetChatId,
                        messageId: messageId
                    }
                });
            } catch (error) {
                console.error('Failed to mark message as read API:', error);
            }
        } else {
            console.warn('Read API not fired: chatType/chatId not resolved', { messageId, chatType, chatId });
        }
    }, []);

    const markMessageAsDelivered = useCallback(async (messageId: string, chatType?: 'user' | 'group', chatId?: number) => {
        let targetChatType: 'user' | 'group' | undefined;
        let targetChatId: number | undefined;

        // Optimistically update status ? Usually we don't optimistically update delivery for *incoming* messages
        // because we are the receiver. But we don't store "my received status" usually.
        // We just call the API.

        // However, checks to find chat info are needed to call API
        // We can find the message in our store to get context (chatId, type)
        // But iterating state just to get IDs might be slow.
        // Alternatively, ReceiveMessage listener usually knows the chat context.

        // But for consistency with markMessageAsRead, let's find it.
        let foundKey: string | undefined;

        // Retrieve current messages state to find key
        // Note: In a callback, we can't easily access state without ref or dependency.
        // But wait, markMessageAsRead used setMessages callback to access state. 
        // We can do the same here just to find the key, even if we don't update state.

        // Actually, ReceiveMessage provides correct context! 
        // We should pass chatType and chatId to markMessageAsDelivered if possible.
        // But to keep signature simple (id only), we search.

        if (chatType && chatId) {
            targetChatType = chatType;
            targetChatId = chatId;
        } else {
            setMessages(prev => {
                Object.keys(prev).forEach(key => {
                    if (prev[key].some(m => m.id === messageId)) {
                        foundKey = key;
                    }
                });
                return prev; // No change
            });

            if (foundKey) {
                if (foundKey.startsWith('conv-group-')) {
                    targetChatType = 'group';
                    targetChatId = parseInt(foundKey.replace('conv-group-', ''), 10);
                } else if (foundKey.startsWith('conv-')) {
                    targetChatType = 'user';
                    targetChatId = parseInt(foundKey.replace('conv-', ''), 10);
                }
            }
        }

        if (targetChatType && targetChatId) {
            try {
                await apiClient.post('/api/chat/delivered', null, {
                    params: {
                        type: targetChatType,
                        chatId: targetChatId,
                        messageId: messageId
                    }
                });
            } catch (error) {
                console.error('Failed to mark message as delivered API:', error);
            }
        }
    }, []);

    const fetchMessages = useCallback(async (chatType: 'user' | 'group', chatId: number) => {
        try {
            const response = await chatService.getMessages(chatType, chatId);
            if (response.success && response.result) {
                const convId = chatType === 'user' ? `conv-${chatId}` : `conv-group-${chatId}`;

                const mappedMessages: Message[] = response.result.map((msg: any) => {
                    const isRead = msg.isRead === true;
                    const isDelivered = msg.isDelivered === true;
                    const status: 'read' | 'delivered' | 'sent' = isRead ? 'read' : (isDelivered ? 'delivered' : 'sent');
                    const attachments = mapAttachments(msg.attachments);

                    return {
                        id: msg.messageId.toString(),
                        senderId: msg.senderId.toString(),
                        senderName: resolveSenderName(chatType, chatId, msg.senderId, msg.senderName),
                        content: msg.message || msg.messageText || '',
                        timestamp: new Date(msg.createdOn),
                        status: status,
                        attachments
                    };
                }).reverse(); // API usually returns descending, we need ascending for UI

                setMessages(prev => ({
                    ...prev,
                    [convId]: mappedMessages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, [mapAttachments, resolveSenderName]);

    const fetchOlderMessages = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        beforeMessageId: number
    ): Promise<number> => {
        try {
            const response = await chatService.getMessages(chatType, chatId, 1, 50, beforeMessageId);
            if (!response.success || !response.result) {
                return 0;
            }

            const convId = chatType === 'user' ? `conv-${chatId}` : `conv-group-${chatId}`;
            const mappedMessages: Message[] = response.result.map((msg: any) => {
                const isRead = msg.isRead === true;
                const isDelivered = msg.isDelivered === true;
                const status: 'read' | 'delivered' | 'sent' = isRead ? 'read' : (isDelivered ? 'delivered' : 'sent');
                const attachments = mapAttachments(msg.attachments);

                return {
                    id: msg.messageId.toString(),
                    senderId: msg.senderId.toString(),
                    senderName: resolveSenderName(chatType, chatId, msg.senderId, msg.senderName),
                    content: msg.message || msg.messageText || '',
                    timestamp: new Date(msg.createdOn),
                    status,
                    attachments
                };
            }).reverse();

            let addedCount = 0;
            setMessages(prev => {
                const existing = prev[convId] || [];
                const existingIds = new Set(existing.map(m => m.id));
                const olderUnique = mappedMessages.filter(m => !existingIds.has(m.id));
                addedCount = olderUnique.length;

                if (olderUnique.length === 0) {
                    return prev;
                }

                return {
                    ...prev,
                    [convId]: [...olderUnique, ...existing]
                };
            });

            return addedCount;
        } catch (error) {
            console.error('Failed to fetch older messages:', error);
            return 0;
        }
    }, [mapAttachments, resolveSenderName]);

    const joinChat = useCallback(async (chatType: 'user' | 'group', chatId: number) => {
        // Ensure connection is established first
        const conn = await connect();

        if (conn && conn.state === HubConnectionState.Connected) {
            try {
                const method = chatType === 'group' ? 'JoinGroupChat' : 'JoinPrivateChat';
                await conn.invoke(method, chatId);
                console.log(`Successfully joined ${chatType} chat: ${chatId}`);
                setActiveChat({ type: chatType, id: chatId });

                // Fetch history after joining
                await fetchMessages(chatType, chatId);
            } catch (err) {
                console.error(`Error joining ${chatType} chat ${chatId}:`, err);
            }
        } else {
            console.warn(`Cannot join ${chatType} chat ${chatId}: Connection not connected (State: ${conn?.state})`);
        }
    }, []);

    const getNumericChatId = useCallback((_chatType: 'user' | 'group', targetId: string): number => {
        // If it already has a prefix, extract the ID and trust it
        if (targetId.startsWith('conv-')) {
            const idPart = targetId.split('-').pop();
            return parseInt(idPart || '0', 10);
        }

        // Otherwise, it's a raw numeric ID (like group ID or user ID)
        return parseInt(targetId || '0', 10);
    }, []);

    const joinAllMemberships = useCallback(async (connection: HubConnection): Promise<void> => {
        try {
            const response = await chatService.getMemberships();
            if (!response.success || !response.result?.length) return;

            for (const membership of response.result) {
                const method = membership.chatType === 'group' ? 'JoinGroupChat' : 'JoinPrivateChat';
                await connection.invoke(method, membership.chatId);
            }
        } catch (error) {
            console.error('Failed to join memberships:', error);
        }
    }, []);

    const connect = useCallback(async (): Promise<HubConnection | null> => {
        // If already connected, return existing connection
        if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
            return connectionRef.current;
        }

        // If currently connecting, wait for it
        if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connecting) {
            let retries = 10;
            while (connectionRef.current.state === HubConnectionState.Connecting && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries--;
            }
            return connectionRef.current;
        }

        // Clean up any existing connection before creating a new one
        if (connectionRef.current) {
            try {
                console.log('Cleaning up old SignalR connection...');
                await connectionRef.current.stop();
                connectionRef.current = null;
            } catch (err) {
                console.warn('Error stopping old connection:', err);
            }
        }

        // Get access token if available (for future token-based auth)
        // Currently using cookie-based auth, but preparing for token support
        const getAccessToken = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    // If token is added to user object in future, return it here
                    return user.accessToken || null;
                }
            } catch (error) {
                console.error('Failed to get access token:', error);
            }
            return null;
        };

        const accessToken = getAccessToken();
        const hubUrl = `${API_BASE_URL}/hubs/chat`;

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: true,
                accessTokenFactory: accessToken ? () => accessToken : undefined
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        connectionRef.current = connection;

        // Register listeners
        connection.onreconnected(async () => {
            console.log('SignalR Reconnected — rejoining active chat');
            await joinAllMemberships(connection);
            if (activeChatRef.current) {
                const { type, id } = activeChatRef.current;
                try {
                    const method = type === 'group' ? 'JoinGroupChat' : 'JoinPrivateChat';
                    await connection.invoke(method, id);
                    console.log(`Re-joined ${type} chat: ${id}`);
                } catch (err) {
                    console.error(`Failed to re-join ${type} chat:`, err);
                }
            }
        });

        // Remove existing listeners to prevent duplicates (important for hot-reload)
        connection.off('ReceiveMessage');
        connection.off('ChatListPatched');
        connection.off('UserTyping');
        connection.off('MessageDelivered');
        connection.off('MessageDeliveredBatch');
        connection.off('MessageRead');
        connection.off('UserPresenceChanged');

        connection.on('ReceiveMessage', (msg: any) => {
            console.log('Message received', msg);

            const incomingChatType = normalizeChatType(msg.chatType);
            const convId = incomingChatType === 'user' ? `conv-${msg.chatId}` : `conv-group-${msg.chatId}`;
            const existingConversation = conversationsRef.current.find((conv) => conv.id === convId);
            const isActiveIncomingChat =
                activeChatRef.current?.type === incomingChatType &&
                activeChatRef.current?.id === Number(msg.chatId);

            // Determine status based on flags if present, otherwise default to 'sent'
            const isRead = msg.isRead === true;
            const isDelivered = msg.isDelivered === true;
            const status: 'read' | 'delivered' | 'sent' = isRead ? 'read' : (isDelivered ? 'delivered' : 'sent');

            const newMsg: Message = {
                id: msg.messageId?.toString() || msg.id?.toString() || `msg-${Date.now()}`,
                senderId: msg.senderId?.toString(),
                senderName: msg.senderName,
                content: msg.message || msg.content,
                timestamp: new Date(msg.createdOn || msg.timestamp || Date.now()),
                status: status,
                attachments: mapAttachments(msg.attachments),
            };
            const shouldIncrementUnreadConversationCount =
                newMsg.senderId !== currentUserRef.current.id &&
                !isActiveIncomingChat &&
                !(existingConversation?.isMuted === true) &&
                (existingConversation?.unreadCount ?? 0) === 0;

            if (shouldIncrementUnreadConversationCount) {
                setUnreadConversationCount((count) => count + 1);
            }

            setMessages((prev) => {
                const existingMessages = prev[convId] || [];
                const isOwnMessage = newMsg.senderId === currentUserRef.current.id;

                // Check if message already exists (deduplication)
                const messageExists = existingMessages.some(m => m.id === newMsg.id);
                if (messageExists) {
                    console.log('Message already exists, skipping duplicate');
                    return prev;
                }

                // If it's an incoming message (not from us), mark as delivered
                if (!isOwnMessage) {
                    // We need to trigger this asynchronously
                    if (!deliveredAckRef.current.has(newMsg.id)) {
                        deliveredAckRef.current.add(newMsg.id);
                        setTimeout(() => markMessageAsDelivered(newMsg.id, incomingChatType, msg.chatId), 300);
                    }
                }

                // Check if this is replacing a pending message from current user
                if (msg.senderId?.toString() === currentUserRef.current.id) {
                    // Find and replace the most recent pending message with same content
                    const pendingIndex = existingMessages.findIndex(
                        m => m.status === 'pending' && m.content === newMsg.content
                    );

                    if (pendingIndex !== -1) {
                        // Replace pending message with server message
                        const updated = [...existingMessages];
                        updated[pendingIndex] = newMsg;
                        console.log('Replaced pending message with server message');
                        return {
                            ...prev,
                            [convId]: updated
                        };
                    }
                }

                // Otherwise, add as new message (received from another user)
                return {
                    ...prev,
                    [convId]: [...existingMessages, newMsg]
                };
            });

            // Update conversation last message in conversations list
            setConversations((prev) => {
                const exists = prev.some(conv => conv.id === convId);
                if (exists) {
                    return prev.map((conv) => {
                        if (conv.id !== convId) {
                            return conv;
                        }

                        const nextUnreadCount = newMsg.senderId === currentUserRef.current.id
                            ? conv.unreadCount
                            : (isActiveIncomingChat ? 0 : conv.unreadCount + 1);

                        return {
                            ...conv,
                            lastMessage: newMsg,
                            lastMessageTime: newMsg.timestamp,
                            unreadCount: nextUnreadCount
                        };
                    });
                } else {
                    // New conversation from someone else
                    const newConv: Conversation = {
                        id: convId,
                        type: incomingChatType === 'user' ? 'individual' : 'group',
                        name: incomingChatType === 'user' ? (msg.senderName || 'New Chat') : (msg.chatName || 'New Group'),
                        avatar: incomingChatType === 'user' ? msg.senderAvatar : msg.groupIcon,
                        lastMessage: newMsg,
                        lastMessageTime: newMsg.timestamp,
                        unreadCount: isActiveIncomingChat ? 0 : 1,
                        participants: incomingChatType === 'user' ? [
                            currentUserRef.current,
                            { id: msg.senderId?.toString(), name: msg.senderName, position: 'Contact', status: 'online', email: '' }
                        ] : [] // Group participants would need an extra fetch or be in msg
                    };

                    return [newConv, ...prev];
                }
            });
        });
        connection.on('ChatListPatched', (chat: any) => {
            if (!chat) return;

            const patchedChatType = normalizeChatType(chat.chatType);
            const convId = patchedChatType === 'user' ? `conv-${chat.chatId}` : `conv-group-${chat.chatId}`;
            const convType = patchedChatType === 'user' ? 'individual' : 'group';

            const isRead = chat.isRead === true;
            const isDelivered = chat.isDelivered === true;
            const status: 'read' | 'delivered' | 'sent' = isRead ? 'read' : (isDelivered ? 'delivered' : 'sent');
            const statusRank: Record<'pending' | 'sent' | 'delivered' | 'read', number> = {
                pending: 0,
                sent: 1,
                delivered: 2,
                read: 3
            };

            setConversations((prev) => {
                const existing = prev.find((c) => c.id === convId);
                const isPatchedChatActive =
                    activeChatRef.current?.type === patchedChatType &&
                    activeChatRef.current?.id === Number(chat.chatId);
                const mergedStatus: 'read' | 'delivered' | 'sent' = (() => {
                    const existingStatus = existing?.lastMessage?.status;
                    if (!existingStatus) {
                        return status;
                    }

                    const isSameLastMessage =
                        !!existing.lastMessage?.id &&
                        !!chat.lastMessageId &&
                        existing.lastMessage.id === chat.lastMessageId.toString();

                    if (!isSameLastMessage) {
                        return status;
                    }

                    return statusRank[existingStatus] >= statusRank[status]
                        ? (existingStatus === 'pending' ? 'sent' : existingStatus)
                        : status;
                })();

                const lastMsg: Message | undefined = chat.lastMessage
                    ? {
                        id: (chat.lastMessageId || `msg-${Date.now()}`).toString(),
                        senderId: chat.isLastMessageMine
                            ? currentUserRef.current.id
                            : (chat.lastMessageSenderId?.toString() || ''),
                        senderName: chat.isLastMessageMine
                            ? currentUserRef.current.name
                            : (chat.title || ''),
                        content: chat.lastMessage,
                        timestamp: new Date(chat.lastMessageTime || Date.now()),
                        status: mergedStatus
                    }
                    : undefined;
                const participants = existing?.participants?.length
                    ? existing.participants.map((p) => {
                        if (convType !== 'individual') return p;
                        if (p.id === currentUserRef.current.id) return p;
                        return {
                            ...p,
                            status: mapPresenceToUserStatus(chat.availabilityStatus, chat.isOnline)
                        };
                    })
                    : (convType === 'individual'
                        ? [
                            currentUserRef.current,
                            {
                                id: (chat.lastMessageSenderId && !chat.isLastMessageMine
                                    ? chat.lastMessageSenderId.toString()
                                    : 'unknown'),
                                name: chat.title || 'Contact',
                                avatar: chat.avatarUrl,
                                position: 'Contact',
                                status: mapPresenceToUserStatus(chat.availabilityStatus, chat.isOnline),
                                email: ''
                            }
                        ]
                        : []);

                const patched: Conversation = {
                    id: convId,
                    type: convType,
                    name: chat.title || existing?.name || 'Chat',
                    avatar: chat.avatarUrl || existing?.avatar,
                    lastMessage: lastMsg ?? existing?.lastMessage,
                    lastMessageTime: new Date(chat.lastMessageTime || existing?.lastMessageTime || Date.now()),
                    unreadCount: (() => {
                        if (isPatchedChatActive) {
                            return 0;
                        }

                        const existingUnreadCount = existing?.unreadCount || 0;
                        const patchedUnreadCount = typeof chat.unreadCount === 'number'
                            ? chat.unreadCount
                            : existingUnreadCount;

                        // Preserve higher local unread count so a slightly stale patch
                        // does not wipe realtime badges right after ReceiveMessage.
                        return Math.max(existingUnreadCount, patchedUnreadCount);
                    })(),
                    participants,
                    isOnline: typeof chat.isOnline === 'boolean' ? chat.isOnline : existing?.isOnline,
                    isPinned: typeof chat.isPinned === 'boolean' ? chat.isPinned : existing?.isPinned,
                    isMuted: typeof chat.isMuted === 'boolean' ? chat.isMuted : existing?.isMuted,
                    isLeft: typeof chat.isLeft === 'boolean' ? chat.isLeft : existing?.isLeft,
                    leftOn: chat.leftOn
                        ? new Date(chat.leftOn)
                        : existing?.leftOn,
                    mentions: existing?.mentions
                };

                if (existing) {
                    return prev.map((c) => (c.id === convId ? patched : c));
                }

                return [...prev, patched];
            });
        });

        connection.on('UserPresenceChanged', (evt: any) => {
            const userId = Number(evt?.userId ?? evt?.UserId);
            const statusCode = Number(evt?.status ?? evt?.Status);
            const isOnline = Boolean(evt?.isOnline ?? evt?.IsOnline);

            if (!Number.isFinite(userId)) return;

            const mappedStatus = mapPresenceToUserStatus(
                Number.isFinite(statusCode) ? statusCode : undefined,
                isOnline
            );

            const changedUser = usersRef.current.find((u) => Number(u.id) === userId);
            const normalizedChangedUserName = (changedUser?.name || '').trim().toLowerCase();

            setUsers((prev) =>
                prev.map((u) =>
                    Number(u.id) === userId
                        ? { ...u, status: mappedStatus }
                        : u
                )
            );

            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.type !== 'individual') {
                        return conv;
                    }

                    const hasTargetParticipant = conv.participants.some((p) => Number(p.id) === userId);
                    const hasNameFallbackMatch =
                        !!normalizedChangedUserName &&
                        conv.name.trim().toLowerCase() === normalizedChangedUserName;

                    if (!hasTargetParticipant && !hasNameFallbackMatch) {
                        return conv;
                    }

                    return {
                        ...conv,
                        isOnline,
                        participants: conv.participants.map((p) =>
                            Number(p.id) === userId
                                || (
                                    hasNameFallbackMatch &&
                                    Number(p.id) !== Number(currentUserRef.current.id)
                                )
                                ? { ...p, status: mappedStatus }
                                : p
                        )
                    };
                })
            );
        });

        // Listen for typing indicators
        // Server sends: await Clients.Group(groupName).SendAsync("UserTyping", chatType, chatId, userId, userName);
        connection.on('UserTyping', (chatType: string, chatId: number, userId: any, userName: string) => {
            console.log('UserTyping received:', { chatType, chatId, userId, userName });

            const numericChatId = Number(chatId);
            const convId = chatType === 'user' ? `conv-${numericChatId}` : `conv-group-${numericChatId}`;
            const userIdStr = userId?.toString();

            // Don't show own typing indicator
            if (userIdStr === currentUserRef.current.id) {
                return;
            }

            // Fallback for missing userName from server
            let finalUserName = userName;
            if (!finalUserName) {
                const foundUser = usersRef.current.find(u => u.id === userIdStr);
                finalUserName = foundUser ? foundUser.name : 'Someone';
            }

            console.log(`Setting typing status for ${convId}: ${finalUserName}`);

            setTypingUsers(prev => ({
                ...prev,
                [convId]: {
                    userId: userIdStr,
                    userName: finalUserName,
                    timestamp: Date.now()
                }
            }));

            // Auto-remove typing indicator after 3 seconds
            setTimeout(() => {
                setTypingUsers(prev => {
                    const { [convId]: _, ...rest } = prev;
                    return rest;
                });
            }, 3000);
        });

        // Listen for message delivered
        // Server sends: .MessageDelivered(messageId, userId);
        connection.on('MessageDelivered', (messageId: number | string, userId: number | string) => {
            console.log('MessageDelivered received:', { messageId, userId });

            // Convert to string for consistent comparison
            const msgIdStr = messageId.toString();

            setMessages(prev => {
                const newMessages = { ...prev };
                let updated = false;

                Object.keys(newMessages).forEach(key => {
                    const msgs = newMessages[key];
                    const msgIndex = msgs.findIndex(m => m.id === msgIdStr);

                    // Only update if current status is sent (don't downgrade from read)
                    if (msgIndex !== -1 && msgs[msgIndex].status === 'sent') {
                        const updatedAppMessages = [...msgs];
                        updatedAppMessages[msgIndex] = {
                            ...updatedAppMessages[msgIndex],
                            status: 'delivered'
                        };
                        newMessages[key] = updatedAppMessages;
                        updated = true;
                    }
                });

                return updated ? newMessages : prev;
            });

            // Keep conversation preview tick in sync with message state.
            setConversations((prev) => {
                let updated = false;
                const next = prev.map((conv) => {
                    if (!conv.lastMessage || conv.lastMessage.id !== msgIdStr || conv.lastMessage.status !== 'sent') {
                        return conv;
                    }

                    updated = true;
                    return {
                        ...conv,
                        lastMessage: {
                            ...conv.lastMessage,
                            status: 'delivered' as const
                        }
                    };
                });

                return updated ? next : prev;
            });
        });

        connection.on('MessageDeliveredBatch', (type: string, chatId: number, userId: number | string, messageIds: Array<number | string>) => {
            console.log('MessageDeliveredBatch received:', { type, chatId, userId, count: messageIds?.length || 0 });

            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                return;
            }

            const messageIdSet = new Set(messageIds.map((x) => x.toString()));

            setMessages(prev => {
                const newMessages = { ...prev };
                let updated = false;

                Object.keys(newMessages).forEach(key => {
                    const msgs = newMessages[key];
                    let changed = false;

                    const mapped = msgs.map((m) => {
                        if (!messageIdSet.has(m.id) || m.status !== 'sent') {
                            return m;
                        }

                        changed = true;
                        return {
                            ...m,
                            status: 'delivered' as const
                        };
                    });

                    if (changed) {
                        newMessages[key] = mapped;
                        updated = true;
                    }
                });

                return updated ? newMessages : prev;
            });

            // Keep conversation preview tick in sync with message state.
            setConversations((prev) => {
                let updated = false;
                const next = prev.map((conv) => {
                    if (!conv.lastMessage || !messageIdSet.has(conv.lastMessage.id) || conv.lastMessage.status !== 'sent') {
                        return conv;
                    }

                    updated = true;
                    return {
                        ...conv,
                        lastMessage: {
                            ...conv.lastMessage,
                            status: 'delivered' as const
                        }
                    };
                });

                return updated ? next : prev;
            });
        });

        // Listen for read receipts
        // Server sends: .MessageRead(type, chatId, messageId, userId);
        connection.on('MessageRead', (type: string, chatId: number, messageId: number | string, userId: number | string) => {
            console.log('MessageRead received:', { type, chatId, messageId, userId });

            const msgIdStr = messageId.toString();
            const readChatType = normalizeChatType(type);
            const readConvId = readChatType === 'user' ? `conv-${chatId}` : `conv-group-${chatId}`;

            // Update local message status if it matches
            // We need to iterate through all conversations to find the message
            setMessages(prev => {
                const newMessages = { ...prev };
                let updated = false;

                Object.keys(newMessages).forEach(key => {
                    const msgs = newMessages[key];
                    const msgIndex = msgs.findIndex(m => m.id === msgIdStr);

                    if (msgIndex !== -1) {
                        // Create new array and object to maintain immutability
                        const updatedAppMessages = [...msgs];
                        updatedAppMessages[msgIndex] = {
                            ...updatedAppMessages[msgIndex],
                            status: 'read'
                        };
                        newMessages[key] = updatedAppMessages;
                        updated = true;
                    }
                });

                return updated ? newMessages : prev;
            });

            // Keep conversation preview tick in sync with message state.
            setConversations((prev) => {
                let updated = false;
                const next = prev.map((conv) => {
                    const isTargetConversation = conv.id === readConvId;
                    const shouldUpgradeTick =
                        !!conv.lastMessage &&
                        conv.lastMessage.id === msgIdStr &&
                        conv.lastMessage.status !== 'read';
                    const shouldClearUnread = isTargetConversation && conv.unreadCount !== 0;

                    if (!shouldUpgradeTick && !shouldClearUnread) {
                        return conv;
                    }

                    updated = true;

                    if (shouldUpgradeTick) {
                        return {
                            ...conv,
                            unreadCount: isTargetConversation ? 0 : conv.unreadCount,
                            lastMessage: {
                                ...conv.lastMessage!,
                                status: 'read' as const
                            }
                        };
                    }

                    return {
                        ...conv,
                        unreadCount: 0
                    };
                });

                return updated ? next : prev;
            });
        });

        try {
            await connection.start();
            await joinAllMemberships(connection);
            console.log('SignalR Connected.');
            setHubConnection(connection);
            return connection;
        } catch (err) {
            console.error('SignalR Connection Error: ', err);
            // ...
            throw err;
        }
    }, [joinAllMemberships, mapAttachments, mapPresenceToUserStatus, markMessageAsDelivered, normalizeChatType]);

    const disconnect = useCallback(async () => {
        if (connectionRef.current) {
            try {
                await connectionRef.current.stop();
                console.log('SignalR Disconnected.');
                setHubConnection(null);
                connectionRef.current = null;
                setActiveChat(null);
                deliveredAckRef.current.clear();
            } catch (err) {
                console.error('SignalR Disconnection Error: ', err);
            }
        }
    }, []);

    useEffect(() => {
        if (authUser) {
            connect().catch((err) => console.error('Failed to connect SignalR (app-wide):', err));
            refreshUnreadConversationCount().catch((err) => console.error('Failed to fetch chat unread count on login:', err));
        } else {
            disconnect().catch((err) => console.error('Failed to disconnect SignalR:', err));
            setUnreadConversationCount(0);
        }

        const handleTokenRefresh = () => {
            if (!connectionRef.current || connectionRef.current.state === HubConnectionState.Disconnected) {
                console.log('Token refreshed, attempting to reconnect SignalR...');
                connect().catch((err) => console.error('Failed to reconnect SignalR after token refresh:', err));
            }
        };

        window.addEventListener('auth:token-refreshed', handleTokenRefresh);
        return () => window.removeEventListener('auth:token-refreshed', handleTokenRefresh);
    }, [authUser, connect, disconnect, refreshUnreadConversationCount]);
    const startPrivateChat = useCallback(async (targetUserId: number): Promise<number> => {
        try {
            const response = await chatService.startPrivateChat({ targetUserId });
            // Use .result.chatId as per user's confirmed response structure
            if (response.success && response.result && response.result.chatId) {
                const chatId = response.result.chatId;

                // Join SignalR group for this chat
                if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
                    await connectionRef.current.invoke("JoinPrivateChat", chatId);
                } else {
                    // Try to connect first if not connected
                    const conn = await connect();
                    if (conn && conn.state === HubConnectionState.Connected) {
                        await conn.invoke("JoinPrivateChat", chatId);
                    }
                }

                // Fetch history for the new private chat
                await fetchMessages('user', chatId);

                return chatId;
            }
            throw new Error(response.message || 'Failed to start private chat');
        } catch (error) {
            console.error('Failed to start private chat:', error);
            throw error;
        }
    }, [connect]);

    const createGroup = useCallback(async (
        groupName: string,
        userIds: number[],
        groupImage?: File | null
    ): Promise<number> => {
        try {
            const response = await chatService.createGroup({
                groupName,
                userIds,
                groupImage: groupImage ?? null,
            });

            if (response.success && response.result?.groupId) {
                const groupId = response.result.groupId;

                if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
                    await connectionRef.current.invoke("JoinGroupChat", groupId);
                } else {
                    const conn = await connect();
                    if (conn && conn.state === HubConnectionState.Connected) {
                        await conn.invoke("JoinGroupChat", groupId);
                    }
                }

                await fetchMessages('group', groupId);
                return groupId;
            }

            throw new Error(response.message || 'Failed to create group');
        } catch (error) {
            console.error('Failed to create group:', error);
            throw error;
        }
    }, [connect, fetchMessages]);

    const toggleChatPinned = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        isPinned: boolean
    ): Promise<void> => {
        const response = await chatService.togglePinned({ chatType, chatId, isPinned });
        if (!response.success) {
            throw new Error(response.message || 'Failed to update pinned state');
        }
    }, []);

    const toggleChatMuted = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        isMuted: boolean
    ): Promise<void> => {
        const response = await chatService.toggleMute({ chatType, chatId, isMuted });
        if (!response.success) {
            throw new Error(response.message || 'Failed to update mute state');
        }
    }, []);

    const toggleChatUnread = useCallback(async (
        chatType: 'user' | 'group',
        chatId: number,
        isUnread: boolean,
        lastMessageId?: number | null
    ): Promise<void> => {
        const response = await chatService.toggleUnread({
            chatType,
            chatId,
            isUnread,
            lastMessageId: lastMessageId ?? null
        });
        if (!response.success) {
            throw new Error(response.message || 'Failed to update unread state');
        }
    }, []);


    const value: MessengerContextType = {
        conversations,
        setConversations,
        users,
        currentUser,
        unreadConversationCount,
        isLoadingChatList,
        isLoadingBootstrap,
        consumeUnreadConversation,
        refreshUnreadConversationCount,
        fetchChatList,
        fetchProjectGroupChats,
        fetchBootstrap,
        updateConversation,
        messages,
        setMessages,
        sendMessage,
        sendFileMessage,
        downloadChatAttachment,
        joinChat,
        setActiveChat,
        activeChat,
        getNumericChatId,
        hubConnection,
        connect,
        disconnect,
        typingUsers,
        sendTypingIndicator,
        markMessageAsRead,
        markMessageAsDelivered,
        startPrivateChat,
        createGroup,
        fetchMessages,
        fetchOlderMessages,
        toggleChatPinned,
        toggleChatMuted,
        toggleChatUnread
    };

    return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>;
};

export const useMessengerContext = (): MessengerContextType => {
    const context = useContext(MessengerContext);
    if (context === undefined) {
        throw new Error('useMessengerContext must be used within a MessengerProvider');
    }
    return context;
};
