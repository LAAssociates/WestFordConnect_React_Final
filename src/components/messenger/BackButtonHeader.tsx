import React from 'react';

interface BackButtonHeaderProps {
  title: string;
  onBack: () => void;
}

const BackButtonHeader: React.FC<BackButtonHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="flex items-center gap-[14.5px]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="14" viewBox="0 0 22 14" fill="none">
          <path d="M1 7L7 1M1 7L7 13M1 7L20.5 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="stroke-[#9A9A9A] group-hover:stroke-black transition-all duration-300" />
        </svg>
      </button>
      <h2 className="font-semibold text-[#262626]">{title}</h2>
    </div>
  );
};

export default BackButtonHeader;





