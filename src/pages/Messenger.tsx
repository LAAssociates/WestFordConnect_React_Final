import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import type { Conversation, ConversationFilter, MessengerView, User, Message } from '../components/messenger/types';
import { mockUsers } from '../components/messenger/mockData';
import { useMessengerContext } from '../contexts/MessengerContext';
import { mockAvailabilityItems } from '../components/dashboard/mockData';
import ConversationList from '../components/messenger/ConversationList';
import ChatWindowsContainer from '../components/messenger/ChatWindowsContainer';
import NewChatView from '../components/messenger/NewChatView';
import AddGroupMembersView from '../components/messenger/AddGroupMembersView';
import NewProjectGroupView from '../components/messenger/NewProjectGroupView';
import EmptyStateMain from '../components/messenger/EmptyStateMain';
import MediaFilesModal from '../components/messenger/MediaFilesModal';
import { chatService } from '../services/chatService';

const Messenger: React.FC = () => {
  const CHAT_LIST_PAGE_SIZE = 30;
  const { setPageTitle } = useOutletContext<AppLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    conversations, 
    setConversations, 
    users, 
    isLoadingChatList, 
    isLoadingBootstrap, 
    fetchChatList, 
    fetchProjectGroupChats,
    fetchBootstrap, 
    messages,
    setMessages,
    currentUser,
    consumeUnreadConversation,
    sendMessage: apiSendMessage,
    sendFileMessage: apiSendFileMessage,
    downloadChatAttachment: apiDownloadChatAttachment,
    joinChat,
    startPrivateChat,
    createGroup,
    getNumericChatId,
    hubConnection,
    setActiveChat,
    toggleChatPinned,
    toggleChatMuted,
    toggleChatUnread,
  } = useMessengerContext();
  
  // useMessengerContext provides the real currentUser

  const [openChats, setOpenChats] = useState<Conversation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<User[]>([]);
  const [displayView, setDisplayView] = useState<MessengerView>('conversations');
  const [mediaModalConversationId, setMediaModalConversationId] = useState<string | null>(null);
  const [chatListPage, setChatListPage] = useState(1);
  const [hasMoreChatList, setHasMoreChatList] = useState(true);
  const [isLoadingMoreChatList, setIsLoadingMoreChatList] = useState(false);
  const [projectGroupConversations, setProjectGroupConversations] = useState<Conversation[]>([]);
  const [projectGroupPage, setProjectGroupPage] = useState(1);
  const [hasMoreProjectGroups, setHasMoreProjectGroups] = useState(true);
  const [isLoadingMoreProjectGroups, setIsLoadingMoreProjectGroups] = useState(false);
  const isInitialMount = useRef(true);
  const hasAutoSelected = useRef(false);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    setPageTitle('Messenger');

    // Fetch initial chat data
    fetchChatList(true, 1, CHAT_LIST_PAGE_SIZE, false)
      .then((count) => {
        setChatListPage(1);
        setHasMoreChatList(count >= CHAT_LIST_PAGE_SIZE);
      })
      .catch((err) => console.error('Failed to fetch initial chat list:', err));
    fetchBootstrap();
  }, [setPageTitle, fetchChatList, fetchBootstrap]);

  useEffect(() => {
    return () => {
      setActiveChat(null);
    };
  }, [setActiveChat]);

  useEffect(() => {
    // Mark that initial mount is complete after first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    setOpenChats((prev) => {
      let changed = false;
      const next = prev.map((chat) => {
        const latest =
          conversations.find((c) => c.id === chat.id) ||
          projectGroupConversations.find((c) => c.id === chat.id);

        if (!latest) return chat;

        if (
          chat.isLeft !== latest.isLeft ||
          chat.leftOn?.getTime() !== latest.leftOn?.getTime() ||
          chat.isMuted !== latest.isMuted ||
          chat.isPinned !== latest.isPinned ||
          chat.unreadCount !== latest.unreadCount ||
          chat.lastMessage !== latest.lastMessage ||
          chat.lastMessageTime?.getTime() !== latest.lastMessageTime?.getTime() ||
          chat.mentions !== latest.mentions
        ) {
          changed = true;
          return {
            ...chat,
            isLeft: latest.isLeft,
            leftOn: latest.leftOn,
            isMuted: latest.isMuted,
            isPinned: latest.isPinned,
            unreadCount: latest.unreadCount,
            lastMessage: latest.lastMessage,
            lastMessageTime: latest.lastMessageTime,
            mentions: latest.mentions,
          };
        }

        return chat;
      });

      return changed ? next : prev;
    });
  }, [conversations, projectGroupConversations]);

  const sortConversationsByPinnedAndTime = useCallback((items: Conversation[]): Conversation[] => {
    return [...items].sort((a, b) => {
      const aPinned = a.isPinned === true;
      const bPinned = b.isPinned === true;
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      const aTime = (a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0)).getTime();
      const bTime = (b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0)).getTime();
      return bTime - aTime;
    });
  }, []);

  // Keep project group tab data in sync with real-time updates that land in conversations context.
  useEffect(() => {
    setProjectGroupConversations((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const liveGroups = conversations.filter((c) => c.type === 'group');
      if (liveGroups.length === 0) {
        return prev;
      }

      const liveById = new Map(liveGroups.map((c) => [c.id, c]));
      const prevIds = new Set(prev.map((c) => c.id));

      const updatedExisting = prev.map((groupConv) => {
        const live = liveById.get(groupConv.id);
        if (!live) {
          return groupConv;
        }

        return {
          ...groupConv,
          name: live.name,
          avatar: live.avatar,
          lastMessage: live.lastMessage,
          lastMessageTime: live.lastMessageTime,
          unreadCount: live.unreadCount,
          isPinned: live.isPinned,
          isMuted: live.isMuted,
          isLeft: live.isLeft,
          leftOn: live.leftOn,
          mentions: live.mentions,
        };
      });

      const additions = liveGroups.filter((groupConv) => !prevIds.has(groupConv.id));
      return sortConversationsByPinnedAndTime([...updatedExisting, ...additions]);
    });
  }, [conversations, sortConversationsByPinnedAndTime]);

  const handleSelectConversation = (conversation: Conversation, keepCurrentView = false) => {
    // Check if conversation is already open
    const isAlreadyOpen = openChats.find((chat) => chat.id === conversation.id);

    // Call joinChat API logic
    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, conversation.id);
    
    if (chatIdNum && chatIdNum > 0) {
      joinChat(chatType, chatIdNum);
    }

    // Mark conversation as read in conversations list (for sidebar display)
    // This removes the badge and mention icon from the sidebar
    if (conversation.unreadCount > 0) {
      consumeUnreadConversation();
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversation.id) {
            return {
              ...conv,
              unreadCount: 0,
              mentions: undefined,
            };
          }
          return conv;
        })
      );
    }

    if (!isAlreadyOpen) {
      // Mark previously open conversations as read in openChats (removes their banners)
      // This happens when switching to a new conversation
      const previousOpenChats = openChats.map((chat) => ({
        ...chat,
        unreadCount: 0,
        mentions: undefined,
      }));

      // Add to open chats (max 2) with unreadCount preserved (so banner shows)
      const conversationToAdd = {
        ...conversation,
        // Keep original unreadCount and mentions so banner displays
      };

      if (openChats.length >= 2) {
        setOpenChats([previousOpenChats[1], conversationToAdd]);
      } else {
        setOpenChats([...previousOpenChats, conversationToAdd]);
      }
    }

    if (!keepCurrentView) {
      setDisplayView('conversations');
    }
  };

  // Handle URL parameter for view (e.g., create group flow)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'add-members') {
      setSelectedGroupMembers([]);
      setDisplayView('add-members');
      // Remove the parameter from URL after setting the view
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle URL parameter for auto-selecting conversation
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    const userId = searchParams.get('user');

    // Reset hasAutoSelected when user param changes to allow re-selection
    if (userId && userId !== previousUserId.current) {
      hasAutoSelected.current = false;
      previousUserId.current = userId;
    } else if (!userId) {
      previousUserId.current = null;
    }

    if (conversationId && !hasAutoSelected.current) {
      const conversation = conversations.find((conv) => conv.id === conversationId);
      if (conversation) {
        // Use normal selection flow so joinChat + fetchMessages always runs.
        handleSelectConversation(conversation, false);
        hasAutoSelected.current = true;
        // Remove the parameter from URL after selection
        setSearchParams({}, { replace: true });
      }
    } else if (userId && !hasAutoSelected.current) {
      // Try to find user by ID first
      let user = users.find((u) => u.id === userId);

      // If not found by ID, try to find by matching with availability widget data
      // This handles cases where availability widget uses different IDs (avail-X vs user-X)
      if (!user) {
        const availabilityItem = mockAvailabilityItems.find((item) => item.id === userId);
        if (availabilityItem) {
          // Don't allow messaging self
          if (availabilityItem.name === 'You') {
            hasAutoSelected.current = true;
            setSearchParams({}, { replace: true });
            return;
          }
          // Find user in messenger by matching name
          user = users.find((u) =>
            u.name.toLowerCase() === availabilityItem.name.toLowerCase()
          );
        }
      }

      // Don't allow messaging self (mockUsers[0] is the current user)
      if (user && user.id === mockUsers[0].id) {
        hasAutoSelected.current = true;
        setSearchParams({}, { replace: true });
        return;
      }

      if (user) {
        // Create or find existing conversation with this user
        const existingConv = conversations.find(
          (conv) => conv.type === 'individual' && conv.participants.some((p) => p.id === user.id)
        );

        if (existingConv) {
          handleSelectConversation(existingConv, false);
          hasAutoSelected.current = true;
          setSearchParams({}, { replace: true });
        } else {
          // Start private chat via API to get real chatId
          startPrivateChat(parseInt(user.id, 10)).then((chatIdNum) => {
            const newConversation: Conversation = {
              id: `conv-${chatIdNum}`,
              type: 'individual',
              name: user.name,
              avatar: user.avatar,
              lastMessageTime: new Date(),
              unreadCount: 0,
              participants: [currentUser, user], // Current user + selected user
            };
            
            // Initialize empty messages for new conversation
            setMessages((prev) => ({
              ...prev,
              [newConversation.id]: [],
            }));
            
            handleSelectConversation(newConversation, false);
            hasAutoSelected.current = true;
            setSearchParams({}, { replace: true });
          }).catch(err => {
            console.error('Failed to start private chat (auto-select):', err);
            hasAutoSelected.current = true;
            setSearchParams({}, { replace: true });
          });
        }
      }
    }
  }, [searchParams, conversations, openChats, setSearchParams, setConversations, setMessages, handleSelectConversation, startPrivateChat, currentUser, users]);

  // Filter conversations based on active filter and search query
  const filteredConversations = useMemo(() => {
    const sourceConversations = activeFilter === 'project-groups'
      ? projectGroupConversations
      : conversations;

    let filtered = sourceConversations;

    // Filter out conversations with no messages (blank chats)
    // A conversation is valid if it has messages in state OR a lastMessage preview from API
    filtered = filtered.filter((conv) => {
      const conversationMessages = messages[conv.id];
      const hasLoadedMessages = conversationMessages && conversationMessages.length > 0;
      const hasLastMessagePreview = !!conv.lastMessage;
      // Keep groups visible even before first message (e.g., right after creation).
      return conv.type === 'group' || hasLoadedMessages || hasLastMessagePreview;
    });

    // Apply filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter((conv) => conv.unreadCount > 0);
    } else if (activeFilter === 'project-groups') {
      filtered = filtered.filter((conv) => conv.type === 'group');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) => conv.name.toLowerCase().includes(query)
      );
    }

    return sortConversationsByPinnedAndTime(filtered);
  }, [conversations, projectGroupConversations, activeFilter, searchQuery, messages, sortConversationsByPinnedAndTime]);

  const handleLoadMoreConversations = async () => {
    if (activeFilter === 'project-groups') {
      if (isLoadingMoreProjectGroups || !hasMoreProjectGroups) return;
      setIsLoadingMoreProjectGroups(true);
      try {
        const nextPage = projectGroupPage + 1;
        const loaded = await fetchProjectGroupChats(nextPage, CHAT_LIST_PAGE_SIZE);
        setProjectGroupConversations((prev) => {
          const existing = new Set(prev.map((c) => c.id));
          const unique = loaded.filter((c) => !existing.has(c.id));
          return [...prev, ...unique];
        });
        setProjectGroupPage(nextPage);
        if (loaded.length < CHAT_LIST_PAGE_SIZE) {
          setHasMoreProjectGroups(false);
        }
      } catch (error) {
        console.error('Failed to load more project groups:', error);
      } finally {
        setIsLoadingMoreProjectGroups(false);
      }
      return;
    }

    if (isLoadingMoreChatList || !hasMoreChatList) return;

    setIsLoadingMoreChatList(true);
    try {
      const nextPage = chatListPage + 1;
      const loaded = await fetchChatList(false, nextPage, CHAT_LIST_PAGE_SIZE, true);
      setChatListPage(nextPage);
      if (loaded < CHAT_LIST_PAGE_SIZE) {
        setHasMoreChatList(false);
      }
    } catch (error) {
      console.error('Failed to load more conversations:', error);
    } finally {
      setIsLoadingMoreChatList(false);
    }
  };

  useEffect(() => {
    if (activeFilter !== 'project-groups') return;
    if (projectGroupConversations.length > 0) return;

    let mounted = true;
    const loadInitialProjectGroups = async () => {
      try {
        const loaded = await fetchProjectGroupChats(1, CHAT_LIST_PAGE_SIZE);
        if (!mounted) return;
        setProjectGroupConversations(loaded);
        setProjectGroupPage(1);
        setHasMoreProjectGroups(loaded.length >= CHAT_LIST_PAGE_SIZE);
      } catch (error) {
        console.error('Failed to fetch project groups:', error);
      }
    };

    loadInitialProjectGroups();
    return () => {
      mounted = false;
    };
  }, [activeFilter, projectGroupConversations.length, fetchProjectGroupChats]);

  const handleCloseChat = (conversationId: string) => {
    const remainingChats = openChats.filter((chat) => chat.id !== conversationId);
    setOpenChats(remainingChats);

    if (remainingChats.length === 0) {
      setActiveChat(null);
      return;
    }

    const nextActiveChat = remainingChats[remainingChats.length - 1];
    const nextChatType = nextActiveChat.type === 'individual' ? 'user' : 'group';
    const nextChatId = getNumericChatId(nextChatType, nextActiveChat.id);
    if (nextChatId > 0) {
      setActiveChat({ type: nextChatType, id: nextChatId });
    } else {
      setActiveChat(null);
    }
  };

  const handleCreateNewChat = () => {
    setDisplayView('new-chat');
  };

  const handleFilterChange = useCallback((filter: ConversationFilter) => {
    if (filter === 'project-groups') {
      // Force refetch on tab select so Project Groups call always triggers.
      setProjectGroupConversations([]);
      setProjectGroupPage(1);
      setHasMoreProjectGroups(true);
      setActiveFilter(filter);
      return;
    }

    // Force refetch for All / Unread as well so tab click always triggers API refresh.
    setChatListPage(1);
    setHasMoreChatList(true);
    void fetchChatList(true, 1, CHAT_LIST_PAGE_SIZE, false)
      .then((count) => {
        setChatListPage(1);
        setHasMoreChatList(count >= CHAT_LIST_PAGE_SIZE);
      })
      .catch((error) => {
        console.error('Failed to refresh chat list on filter change:', error);
      });

    setActiveFilter(filter);
  }, [fetchChatList]);

  const handleSelectContact = (user: User) => {
    // Create or find existing conversation with this user
    const existingConv = conversations.find(
      (conv) => conv.type === 'individual' && conv.participants.some((p) => p.id === user.id)
    );

    if (existingConv) {
      handleSelectConversation(existingConv, true); // Keep new chat view open
    } else {
      // Check if conversation is already open in openChats
      const openChat = openChats.find(
        (chat) => chat.type === 'individual' && chat.participants.some((p) => p.id === user.id)
      );

      if (openChat) {
        handleSelectConversation(openChat, true); // Keep new chat view open
      } else {
        // Start private chat via API to get real chatId
        startPrivateChat(parseInt(user.id, 10)).then((chatIdNum) => {
          const newConversation: Conversation = {
            id: `conv-${chatIdNum}`,
            type: 'individual',
            name: user.name,
            avatar: user.avatar,
            lastMessageTime: new Date(),
            unreadCount: 0,
            participants: [currentUser, user], // Current user + selected user
          };
          
          // Don't add to conversations list - only keep it in openChats
          // Initialize empty messages for new conversation
          setMessages((prev) => ({
            ...prev,
            [newConversation.id]: [],
          }));
          handleSelectConversation(newConversation, true); // Keep new chat view open
        }).catch(err => {
          console.error('Failed to start private chat:', err);
          // TODO: Show error UI
        });
      }
    }
  };

  const handleCreateGroup = () => {
    setSelectedGroupMembers([]);
    setDisplayView('add-members');
  };

  const handleSelectMember = (user: User) => {
    if (!selectedGroupMembers.find((m) => m.id === user.id)) {
      setSelectedGroupMembers([...selectedGroupMembers, user]);
    }
  };

  const handleDeselectMember = (userId: string) => {
    setSelectedGroupMembers(selectedGroupMembers.filter((m) => m.id !== userId));
  };

  const handleNextToGroupCreation = () => {
    if (selectedGroupMembers.length > 0) {
      setDisplayView('new-group');
    }
  };

  const handleBackToConversations = () => {
    setSelectedGroupMembers([]);
    setDisplayView('conversations');
  };

  const handleCreateProjectGroup = async (groupName: string, groupImage?: File | null) => {
    try {
      const memberIds = selectedGroupMembers.map((m) => parseInt(m.id, 10)).filter((id) => id > 0);
      const groupId = await createGroup(groupName, memberIds, groupImage);

      const newGroup: Conversation = {
        id: `conv-group-${groupId}`,
        type: 'group',
        name: groupName,
        lastMessageTime: new Date(),
        unreadCount: 0,
        participants: [currentUser, ...selectedGroupMembers],
      };

      setMessages((prev) => ({
        ...prev,
        [newGroup.id]: prev[newGroup.id] || [],
      }));

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newGroup.id);
        if (exists) return prev;
        return [newGroup, ...prev];
      });
      setProjectGroupConversations((prev) => {
        const exists = prev.some((c) => c.id === newGroup.id);
        if (exists) return prev;
        return [newGroup, ...prev];
      });

      setSelectedGroupMembers([]);
      setDisplayView('conversations');
      handleSelectConversation(newGroup);

      // Re-sync both lists with server so All + Project Groups tabs stay consistent.
      void Promise.all([
        fetchChatList(false, 1, CHAT_LIST_PAGE_SIZE, false),
        fetchProjectGroupChats(1, CHAT_LIST_PAGE_SIZE),
      ])
        .then(([allCount, projectGroups]) => {
          setChatListPage(1);
          setHasMoreChatList(allCount >= CHAT_LIST_PAGE_SIZE);
          setProjectGroupConversations(projectGroups);
          setProjectGroupPage(1);
          setHasMoreProjectGroups(projectGroups.length >= CHAT_LIST_PAGE_SIZE);
        })
        .catch((refreshError) => {
          console.error('Failed to refresh chat lists after group create:', refreshError);
        });
    } catch (err) {
      console.error('Failed to create project group:', err);
    }
  };

  const handleSendMessage = async (conversationId: string, content: string) => {
    // 1. Find the numeric chatId and type for API call
    const conversation = conversations.find((conv) => conv.id === conversationId) || 
                         openChats.find((chat) => chat.id === conversationId);
                         
    if (!conversation) return;
    if (conversation.type === 'group' && conversation.isLeft) return;
    
    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, conversation.id);

    if (!chatIdNum || chatIdNum <= 0) return;

    // 2. Generate tempId and add pending message BEFORE API call
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingMessage: Message = {
      id: tempId,
      tempId: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: new Date(),
      status: 'pending',
    };

    // Add to UI immediately (optimistic update)
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), pendingMessage],
    }));

    // Optimistically update conversations list
    const isInConversationsList = conversations.some((conv) => conv.id === conversationId);
    if (!isInConversationsList) {
      // New conversation: add it to the list
      const updatedConversation: Conversation = {
        ...conversation,
        lastMessage: pendingMessage,
        lastMessageTime: new Date(),
      };
      setConversations([updatedConversation, ...conversations]);
    } else {
      // Existing conversation: update last message and move to top
      setConversations((prev) => {
        const others = prev.filter(c => c.id !== conversationId);
        const updated: Conversation = {
          ...conversation,
          lastMessage: pendingMessage,
          lastMessageTime: new Date(),
        };
        return [updated, ...others];
      });
    }

    // Mark conversation as read in openChats (removes banner after sending)
    setOpenChats((prev) =>
      prev.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            unreadCount: 0,
            mentions: undefined,
          };
        }
        return chat;
      })
    );

    try {
      // 3. Send message to API (SignalR will replace pending message on receive)
      await apiSendMessage(chatType, chatIdNum, content);
    } catch (err) {
      console.error('API Send Error:', err);
      
      // Remove pending message on error
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(m => m.id !== tempId)
      }));
      
      // TODO: Show error notification to user
    }
  };

  const handleSendFile = async (conversationId: string, file: File, caption?: string) => {
    const conversation = conversations.find((conv) => conv.id === conversationId) ||
                         openChats.find((chat) => chat.id === conversationId);

    if (!conversation) return;
    if (conversation.type === 'group' && conversation.isLeft) return;

    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, conversation.id);
    if (!chatIdNum || chatIdNum <= 0) return;

    const tempId = `temp-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const content = (caption && caption.trim()) || file.name;
    const localObjectUrl = URL.createObjectURL(file);
    const pendingMessage: Message = {
      id: tempId,
      tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: new Date(),
      status: 'pending',
      uploadProgress: 0,
      attachments: [
        {
          id: `pending-att-${tempId}`,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          url: localObjectUrl,
          size: file.size,
          contentType: file.type
        }
      ]
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), pendingMessage]
    }));

    setConversations((prev) => {
      const others = prev.filter((c) => c.id !== conversationId);
      const updated: Conversation = {
        ...conversation,
        lastMessage: pendingMessage,
        lastMessageTime: pendingMessage.timestamp
      };
      return [updated, ...others];
    });

    let visualProgress = 0;
    let realProgress = 0;
    const progressTimer = window.setInterval(() => {
      // Smooth fallback: keep moving until near completion
      visualProgress = Math.min(90, visualProgress + 5);
      const nextProgress = Math.max(visualProgress, realProgress);

      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((msg) =>
          msg.id === tempId ? { ...msg, uploadProgress: nextProgress } : msg
        )
      }));
    }, 220);

    try {
      await apiSendFileMessage(chatType, chatIdNum, file, caption, (progress) => {
        realProgress = progress;
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((msg) =>
            msg.id === tempId ? { ...msg, uploadProgress: Math.max(progress, visualProgress) } : msg
          )
        }));
      });

      // Ensure final state is visible before SignalR replacement
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((msg) =>
          msg.id === tempId ? { ...msg, uploadProgress: 100 } : msg
        )
      }));
    } catch (err) {
      console.error('Failed to send file:', err);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((m) => m.id !== tempId)
      }));
    } finally {
      window.clearInterval(progressTimer);
      URL.revokeObjectURL(localObjectUrl);
    }
  };

  const handleDownloadAttachment = async (
    conversationId: string,
    messageId: string,
    attachmentId: number,
    fileName: string
  ) => {
    const conversation = conversations.find((conv) => conv.id === conversationId) ||
                         openChats.find((chat) => chat.id === conversationId);

    if (!conversation) return;

    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, conversation.id);
    const numericMessageId = parseInt(messageId, 10);
    if (!chatIdNum || chatIdNum <= 0 || Number.isNaN(numericMessageId)) return;

    try {
      await apiDownloadChatAttachment(chatType, chatIdNum, numericMessageId, attachmentId, fileName);
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  const handlePinToggle = async (conversationId: string) => {
    const targetConversation =
      conversations.find((conv) => conv.id === conversationId) ||
      openChats.find((chat) => chat.id === conversationId);

    if (!targetConversation) return;

    const nextPinned = !targetConversation.isPinned;
    const chatType = targetConversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, targetConversation.id);

    if (!chatIdNum || chatIdNum <= 0) return;

    // Optimistic update
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            isPinned: nextPinned,
          };
        }
        return conv;
      })
    );

    setOpenChats((prev) =>
      prev.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            isPinned: nextPinned,
          };
        }
        return chat;
      })
    );

    try {
      await toggleChatPinned(chatType, chatIdNum, nextPinned);
      const loaded = await fetchChatList(false, 1, CHAT_LIST_PAGE_SIZE, false);
      setChatListPage(1);
      setHasMoreChatList(loaded >= CHAT_LIST_PAGE_SIZE);
    } catch (err) {
      console.error('Failed to toggle chat pin:', err);

      // Rollback if API fails
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              isPinned: !nextPinned,
            };
          }
          return conv;
        })
      );

      setOpenChats((prev) =>
        prev.map((chat) => {
          if (chat.id === conversationId) {
            return {
              ...chat,
              isPinned: !nextPinned,
            };
          }
          return chat;
        })
      );
    }
  };

  const handleMarkAsRead = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.unreadCount === 0) return;

    // Update conversations
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: 0,
            mentions: undefined,
          };
        }
        return conv;
      })
    );

    // Update messages to mark all as read
    setMessages((prev) => {
      const conversationMessages = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: conversationMessages.map((msg) => ({
          ...msg,
          status: msg.senderId === currentUser.id ? msg.status : 'read',
        })),
      };
    });

    // Update open chats if it's currently open
    setOpenChats((prev) =>
      prev.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            unreadCount: 0,
            mentions: undefined,
          };
        }
        return chat;
      })
    );
  };

  const handleMarkAsReadToggle = (conversationId: string) => {
    const conversation =
      conversations.find((c) => c.id === conversationId) ||
      openChats.find((c) => c.id === conversationId);
    if (!conversation) return;

    const willBeMarkedAsRead = conversation.unreadCount > 0;
    const willBeMarkedAsUnread = !willBeMarkedAsRead;
    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, conversation.id);
    const lastMessageId = conversation.lastMessage?.id ? parseInt(conversation.lastMessage.id, 10) : null;

    if (!chatIdNum || chatIdNum <= 0) return;

    // For unread action, need a last message id to set pointer meaningfully.
    if (willBeMarkedAsUnread && (!lastMessageId || Number.isNaN(lastMessageId))) {
      return;
    }

    // Update conversations
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: willBeMarkedAsRead ? 0 : 1,
          };
        }
        return conv;
      })
    );

    // Update messages to mark all as read/unread
    setMessages((prev) => {
      const conversationMessages = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: conversationMessages.map((msg) => ({
          ...msg,
          // Marking as unread should only affect unread pointer/badge, not mutate receipt state.
          status: willBeMarkedAsRead
            ? (msg.senderId === currentUser.id ? msg.status : 'read')
            : msg.status,
        })),
      };
    });

    // Update open chats if it's currently open
    setOpenChats((prev) =>
      prev.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            unreadCount: willBeMarkedAsRead ? 0 : 1,
          };
        }
        return chat;
      })
    );

    toggleChatUnread(chatType, chatIdNum, willBeMarkedAsUnread, lastMessageId)
      .then(async () => {
        const loaded = await fetchChatList(false, 1, CHAT_LIST_PAGE_SIZE, false);
        setChatListPage(1);
        setHasMoreChatList(loaded >= CHAT_LIST_PAGE_SIZE);
      })
      .catch((err) => {
        console.error('Failed to toggle read/unread state:', err);
        // rollback
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unreadCount: willBeMarkedAsRead ? 1 : 0,
              };
            }
            return conv;
          })
        );
        setOpenChats((prev) =>
          prev.map((chat) => {
            if (chat.id === conversationId) {
              return {
                ...chat,
                unreadCount: willBeMarkedAsRead ? 1 : 0,
              };
            }
            return chat;
          })
        );
      });
  };

  const handleMuteToggle = async (conversationId: string) => {
    const targetConversation =
      conversations.find((conv) => conv.id === conversationId) ||
      openChats.find((chat) => chat.id === conversationId);

    if (!targetConversation) return;

    const nextMuted = !targetConversation.isMuted;
    const chatType = targetConversation.type === 'individual' ? 'user' : 'group';
    const chatIdNum = getNumericChatId(chatType, targetConversation.id);

    if (!chatIdNum || chatIdNum <= 0) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            isMuted: nextMuted,
          };
        }
        return conv;
      })
    );

    // Update open chats if it's currently open
    setOpenChats((prev) =>
      prev.map((chat) => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            isMuted: nextMuted,
          };
        }
        return chat;
      })
    );

    try {
      await toggleChatMuted(chatType, chatIdNum, nextMuted);
      const loaded = await fetchChatList(false, 1, CHAT_LIST_PAGE_SIZE, false);
      setChatListPage(1);
      setHasMoreChatList(loaded >= CHAT_LIST_PAGE_SIZE);
    } catch (err) {
      console.error('Failed to toggle chat mute:', err);

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              isMuted: !nextMuted,
            };
          }
          return conv;
        })
      );

      setOpenChats((prev) =>
        prev.map((chat) => {
          if (chat.id === conversationId) {
            return {
              ...chat,
              isMuted: !nextMuted,
            };
          }
          return chat;
        })
      );
    }
  };

  const handleViewMedia = (conversationId: string) => {
    setMediaModalConversationId(conversationId);
  };

  const handleExitGroup = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId) ||
      openChats.find((c) => c.id === conversationId);
    if (!conversation || conversation.type !== 'group') return;

    const chatIdNum = getNumericChatId('group', conversation.id);
    if (!chatIdNum || chatIdNum <= 0) return;

    const leftOn = new Date();
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isLeft: true, leftOn } : c))
    );
    setOpenChats((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isLeft: true, leftOn } : c))
    );
    setProjectGroupConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isLeft: true, leftOn } : c))
    );

    void chatService.exitGroup({ groupId: chatIdNum })
      .then(() => hubConnection?.invoke('LeaveGroupChat', chatIdNum).catch(() => undefined))
      .catch((err) => {
        console.error('Failed to exit group:', err);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isLeft: false, leftOn: undefined } : c))
        );
        setOpenChats((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isLeft: false, leftOn: undefined } : c))
        );
        setProjectGroupConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, isLeft: false, leftOn: undefined } : c))
        );
      });
  };

  const mediaModalConversation = useMemo(() => {
    if (!mediaModalConversationId) return null;
    return conversations.find((c) => c.id === mediaModalConversationId)
      || openChats.find((c) => c.id === mediaModalConversationId)
      || null;
  }, [conversations, mediaModalConversationId, openChats]);

  const mediaModalMessages = useMemo(() => {
    if (!mediaModalConversationId) return [];
    return messages[mediaModalConversationId] || [];
  }, [mediaModalConversationId, messages]);

  const handleMediaModalDownload = async (messageId: string, attachmentId: number, fileName: string) => {
    if (!mediaModalConversationId || !mediaModalConversation) return;
    await handleDownloadAttachment(
      mediaModalConversationId,
      messageId,
      attachmentId,
      fileName
    );
  };

  // Get open conversation IDs for highlighting (all open chats should be marked as active)
  const openConversationIds = useMemo(() => openChats.map(chat => chat.id), [openChats]);

  // Staff pool for group creation: exclude only current user.
  const groupCandidates = useMemo(() => {
    return users.filter((user) => user.id !== currentUser.id);
  }, [users, currentUser.id]);

  // Contacts list for starting new 1:1 chat: exclude current user and already-open 1:1 chats.
  const contacts = useMemo(() => {
    return users.filter((user) => {
      // Exclude current user
      if (user.id === currentUser.id) return false;

      // Exclude users who have active individual chats
      const hasActiveChat = openChats.some(
        (chat) =>
          chat.type === 'individual' &&
          chat.participants.some((p) => p.id === user.id)
      );

      return !hasActiveChat;
    });
  }, [openChats, users, currentUser.id]);

  return (
    <div className="flex h-full w-full rounded-[16px] overflow-hidden shadow-[2px_2px_4px_0_rgba(0,0,0,0.10)]">
      {/* Left Sidebar - Conversation List or Views */}
      <div className="relative w-[475px] flex-shrink-0">
        {(isLoadingChatList || isLoadingBootstrap) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <AnimatePresence>
          {displayView === 'conversations' && (
            <motion.div
              key="conversations"
              initial={isInitialMount.current ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <ConversationList
                conversations={filteredConversations}
                searchQuery={searchQuery}
                activeFilter={activeFilter}
                openConversationIds={openConversationIds}
                onSearchChange={setSearchQuery}
                onFilterChange={handleFilterChange}
                onSelectConversation={handleSelectConversation}
                onCreateNewChat={handleCreateNewChat}
                onMuteNotifications={handleMuteToggle}
                onPinGroup={handlePinToggle}
                onMarkAsRead={handleMarkAsReadToggle}
                onExitGroup={handleExitGroup}
                currentUserId={currentUser.id}
                onLoadMore={handleLoadMoreConversations}
                hasMore={activeFilter === 'project-groups' ? hasMoreProjectGroups : hasMoreChatList}
                isLoadingMore={activeFilter === 'project-groups' ? isLoadingMoreProjectGroups : isLoadingMoreChatList}
              />
            </motion.div>
          )}

          {displayView === 'new-chat' && (
            <motion.div
              key="new-chat"
              initial={isInitialMount.current ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <NewChatView
                contacts={contacts}
                onSelectContact={handleSelectContact}
                onCreateGroup={handleCreateGroup}
                onBack={handleBackToConversations}
              />
            </motion.div>
          )}

          {displayView === 'add-members' && (
            <motion.div
              key="add-members"
              initial={isInitialMount.current ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <AddGroupMembersView
                staff={groupCandidates}
                selectedMembers={selectedGroupMembers}
                onSelectMember={handleSelectMember}
                onDeselectMember={handleDeselectMember}
                onNext={handleNextToGroupCreation}
                onBack={handleBackToConversations}
              />
            </motion.div>
          )}

          {displayView === 'new-group' && (
            <motion.div
              key="new-group"
              initial={isInitialMount.current ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <NewProjectGroupView
                onBack={handleBackToConversations}
                onCreateGroup={handleCreateProjectGroup}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area - Chat Windows or Empty State */}
      {openChats.length > 0 ? (
        <ChatWindowsContainer
          openChats={openChats}
          messages={messages}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
              onCloseChat={handleCloseChat}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              onDownloadAttachment={handleDownloadAttachment}
              onPinToggle={handlePinToggle}
          onMarkAsReadToggle={handleMarkAsReadToggle}
          onMarkAsRead={handleMarkAsRead}
          onMuteToggle={handleMuteToggle}
          onViewMedia={handleViewMedia}
        />
      ) : (
        <EmptyStateMain />
      )}

      <MediaFilesModal
        isOpen={!!mediaModalConversationId}
        conversationName={mediaModalConversation?.name || 'Chat'}
        messages={mediaModalMessages}
        onClose={() => setMediaModalConversationId(null)}
        onDownload={handleMediaModalDownload}
      />
    </div>
  );
};

export default Messenger;
