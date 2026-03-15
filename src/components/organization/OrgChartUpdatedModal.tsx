import React from 'react';
import { createPortal } from 'react-dom';

interface OrgChartUpdatedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrgChartUpdatedModal: React.FC<OrgChartUpdatedModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[10px] shadow-xl w-full max-w-[371px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[5px] right-[5px] flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <mask id="mask0_948_6618" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
              <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
              <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </mask>
            <g mask="url(#mask0_948_6618)">
              <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
            </g>
          </svg>
        </button>

        {/* Content */}
        <div className="p-[25px]">
          <div className="flex items-center gap-[5px] mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 1.5C14.7848 1.5 17.4555 2.60625 19.4246 4.57538C21.3938 6.54451 22.5 9.21523 22.5 12C22.5 14.7848 21.3938 17.4555 19.4246 19.4246C17.4555 21.3938 14.7848 22.5 12 22.5C9.21523 22.5 6.54451 21.3938 4.57538 19.4246C2.60625 17.4555 1.5 14.7848 1.5 12C1.5 9.21523 2.60625 6.54451 4.57538 4.57538C6.54451 2.60625 9.21523 1.5 12 1.5ZM10.692 14.0715L8.3595 11.7375C8.27588 11.6539 8.17661 11.5876 8.06736 11.5423C7.9581 11.497 7.84101 11.4737 7.72275 11.4737C7.60449 11.4737 7.4874 11.497 7.37814 11.5423C7.26889 11.5876 7.16962 11.6539 7.086 11.7375C6.91712 11.9064 6.82225 12.1354 6.82225 12.3743C6.82225 12.6131 6.91712 12.8421 7.086 13.011L10.056 15.981C10.1394 16.065 10.2386 16.1317 10.3479 16.1773C10.4571 16.2228 10.5744 16.2462 10.6927 16.2462C10.8111 16.2462 10.9284 16.2228 11.0376 16.1773C11.1469 16.1317 11.2461 16.065 11.3295 15.981L17.4795 9.8295C17.5642 9.74623 17.6316 9.647 17.6778 9.53755C17.724 9.42809 17.7481 9.31057 17.7487 9.19177C17.7492 9.07297 17.7262 8.95523 17.6811 8.84535C17.6359 8.73547 17.5694 8.63562 17.4854 8.55156C17.4015 8.46751 17.3017 8.4009 17.1919 8.3556C17.0821 8.31029 16.9644 8.28718 16.8455 8.28759C16.7267 8.288 16.6092 8.31193 16.4997 8.358C16.3902 8.40407 16.2909 8.47136 16.2075 8.556L10.692 14.0715Z" fill="#16A34A" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Org chart updated</h3>
          </div>

          <p className="text-base text-gray-700 mb-[20px]">
            Your updates were saved successfully.
          </p>

          {/* Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-[130px] px-8 py-2 border border-[#CACACA] rounded-[25px] text-sm font-semibold text-gray-900 hover:bg-gray-50 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrgChartUpdatedModal;
