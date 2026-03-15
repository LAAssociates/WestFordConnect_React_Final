import React, { useState } from 'react';
import { cn } from '../../lib/utils/cn';
import type { Resource } from './types';
import ResourceCard from './ResourceCard';
import ResourceDrawer from './ResourceDrawer';
import { resourceService } from '../../services/resourceService';
import type { ResourceItem } from '../../types/resource';
import type { AttachmentOption } from '../common/drawer/inputs/DrawerAttachments';

interface ResourceGridProps {
    resources: Resource[];
    onResourceClick?: (resource: Resource) => void;
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

const ResourceGrid: React.FC<ResourceGridProps> = ({
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

    if (resources.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-sm text-[#535352]">No resources found.</p>
            </div>
        );
    }

    return (
        <>
            <div
                className={cn(
                    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5',
                    'w-full'
                )}
            >
                {resources.map((resource) => (
                    <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onResourceClick={onResourceClick}
                        onEdit={handleEdit}
                        onDownload={onDownload}
                        onFileInfo={handleFileInfo}
                        onDelete={onDelete}
                        searchTerm={searchTerm}
                    />
                ))}
            </div>

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

export default ResourceGrid;

