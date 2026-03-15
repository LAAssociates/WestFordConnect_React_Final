import React from 'react';
import Logo from '../common/Logo';

const EmptyStateMain: React.FC = () => {
    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
            {/* Empty State Content */}
            <div className="flex flex-col items-center z-10">
                <div className="mb-0 relative">
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <Logo centered />
                        <h1 className="text-[16px] leading-normal font-medium text-[#535352] mt-1">WEngage. WEmpower.</h1>
                        <p className="text-[14px] leading-normal font-medium text-[#535352] mt-[46px]">
                            Manage your conversations and projects with clarity and confidence.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyStateMain;
