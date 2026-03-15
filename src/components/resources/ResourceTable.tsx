import React, { useState } from 'react';
import { cn } from '../../lib/utils/cn';
import type { Resource } from './types';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import { getFileTypeIcon } from '../../utils/getFileTypeIcon';
import MacScrollbar from '../common/MacScrollbar';
import ResourceDrawer from './ResourceDrawer';
import ResourceActionMenu from './ResourceActionMenu';
import { resourceService } from '../../services/resourceService';
import type { ResourceItem } from '../../types/resource';
import type { AttachmentOption } from '../common/drawer/inputs/DrawerAttachments';

interface ResourceTableProps {
    resources: Resource[];
    onResourceClick?: (resource: Resource) => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (column: string) => void;
    onEdit?: (resource: Resource) => void;
    onDownload?: (resource: Resource) => void;
    onFileInfo?: (resource: Resource) => void;
    onDelete?: (resource: Resource) => void;
    onSave?: (resource: any) => Promise<void> | void;
    isSaving?: boolean;
    categories?: Array<{ id: string; name: string }>;
    availableUsers?: Array<{ id: string; name: string; avatar?: string; position?: string }>;
    projectGroups?: Array<{ id: string; name: string; avatar?: string; memberCount?: number; members?: any[] }>;
    attachmentOptions?: AttachmentOption[];
    searchTerm?: string;
}



const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${day} ${month}, ${hour12}:${minutesStr} ${ampm}`;
};

const HighlightText: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) {
        return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
        <>
            {parts.map((part, i) => (
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 text-black font-bold">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            ))}
        </>
    );
};


const ResourceTable: React.FC<ResourceTableProps> = ({
    resources,
    onResourceClick,
    onEdit,
    onDownload,
    onFileInfo,
    onDelete,
    onSave,
    isSaving,
    categories = [],
    availableUsers = [],
    projectGroups = [],
    attachmentOptions,
    searchTerm,
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [drawerMode, setDrawerMode] = useState<'info' | 'edit'>('info');
    const [fetchedDetails, setFetchedDetails] = useState<ResourceItem | null>(null);

    const handleFileInfo = async (resource: Resource) => {
        try {
            const response = await resourceService.getSingleResource(parseInt(resource.id, 10));
            if (response.success && response.result) {
                setFetchedDetails(response.result);
            }
        } catch (error) {
            console.error('Failed to fetch resource details', error);
        }
        setSelectedResource(resource);
        setDrawerMode('info');
        setDrawerOpen(true);
        if (onFileInfo) {
            onFileInfo(resource);
        }
    };

    const handleEdit = async (resource: Resource) => {
        try {
            const response = await resourceService.getSingleResource(parseInt(resource.id, 10));
            if (response.success && response.result) {
                setFetchedDetails(response.result);
            }
        } catch (error) {
            console.error('Failed to fetch resource details', error);
        }
        setSelectedResource(resource);
        setDrawerMode('edit');
        setDrawerOpen(true);
        if (onEdit) {
            onEdit(resource);
        }
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        // Delay clearing selectedResource until after the drawer animation completes (300ms)
        // This prevents the "Upload File" title from briefly appearing when closing edit mode
        setTimeout(() => {
            setSelectedResource(null);
        }, 300);
    };

    const handleDrawerSave = async (updatedResource: Resource) => {
        if (onSave) {
            await onSave(updatedResource);
        }
        setDrawerOpen(false);
        setSelectedResource(null);
    };

    return (
        <>
            <MacScrollbar className="overflow-x-auto md:overflow-x-visible">
                <table className="w-full min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white rounded-l-[25px] whitespace-nowrap">
                                Title
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Category
                                </div>
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Type
                                </div>
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Size
                                </div>
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Uploaded On
                                </div>
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Uploaded By
                                </div>
                            </th>
                            <th className="px-[20px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] border-b-[5px] border-white rounded-r-[25px] whitespace-nowrap">
                                <div className="flex gap-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                        <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    Last Modified On
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((resource) => (
                            <tr
                                key={resource.id}
                                className={cn(
                                    'group border-b border-[#E6E6E6] hover:bg-[#E6E6E6] transition-colors'
                                )}
                                onClick={() => onResourceClick?.(resource)}
                            >
                                <td className="px-[20px] py-[15px] whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            {getFileTypeIcon(resource.type)}
                                        </div>
                                        <span className="text-sm font-medium text-black truncate max-w-[200px]" title={resource.title}>
                                            <HighlightText text={resource.title} highlight={searchTerm} />
                                        </span>
                                    </div>
                                </td>
                                <td className="px-[20px] py-[15px] text-sm text-[#535352] whitespace-nowrap">
                                    <div className="flex gap-2.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                            <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                        </svg>
                                        {resource.category}
                                    </div>
                                </td>
                                <td className="px-[20px] py-[15px] text-sm text-[#535352] whitespace-nowrap">
                                    <div className="flex gap-2.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                            <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                        </svg>
                                        {resource.type}
                                    </div>
                                </td>
                                <td className="px-[20px] py-[15px] text-sm text-[#535352] whitespace-nowrap">
                                    <div className="flex gap-2.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                            <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                        </svg>
                                        {resource.size}
                                    </div>
                                </td>
                                <td className="px-[20px] py-[15px] text-sm text-[#535352] whitespace-nowrap">
                                    <div className="flex gap-2.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                            <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                        </svg>
                                        {formatDate(resource.uploadedOn)}
                                    </div>
                                </td>
                                <td className="px-[20px] py-[15px] whitespace-nowrap">
                                    <div className="flex gap-2.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                            <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                        </svg>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={resource.uploadedBy.avatar || avatarPlaceholder}
                                                alt={resource.uploadedBy.name}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            <span className="text-sm text-[#535352]">{resource.uploadedBy.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="pl-[20px] pr-[10px] py-[15px] text-sm text-[#535352] whitespace-nowrap">
                                    <div className="flex items-center justify-between gap-5">
                                        <div className="flex gap-2.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="2" height="19" viewBox="0 0 2 19" fill="none">
                                                <path d="M1 1L1 18" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                            </svg>
                                            {formatDate(resource.lastModifiedOn)}
                                        </div>
                                        <ResourceActionMenu
                                            resource={resource}
                                            onEdit={handleEdit}
                                            onDownload={onDownload}
                                            onFileInfo={handleFileInfo}
                                            onDelete={onDelete}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </MacScrollbar>

            <ResourceDrawer
                isOpen={drawerOpen}
                onClose={handleDrawerClose}
                resource={selectedResource}
                mode={drawerMode}
                onEdit={handleEdit}
                onDownload={onDownload}
                onDelete={onDelete}
                onSave={handleDrawerSave}
                availableUsers={availableUsers}
                projectGroups={projectGroups}
                categories={categories}
                attachmentOptions={attachmentOptions}
                preFetchedDetails={fetchedDetails}
                isSaving={isSaving}
            />
        </>
    );
};

export default ResourceTable;

