import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import background from '../assets/images/auth-background.png';

const NotFound: React.FC = () => {
  const outletContext = useOutletContext<AppLayoutContext | undefined>();
  const setPageTitle = outletContext?.setPageTitle;

  useEffect(() => {
    setPageTitle?.('Page Not Found');
  }, [setPageTitle]);

  return (
    <div className='relative flex-1 w-full h-full flex items-center justify-center bg-white rounded-[10px] overflow-hidden'>
      <div className="mx-auto text-center px-4">
        <div className="flex justify-center items-center gap-4 mb-11">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.3" d="M23.8307 45.4993C35.7969 45.4993 45.4974 35.7989 45.4974 23.8327C45.4974 11.8665 35.7969 2.16602 23.8307 2.16602C11.8646 2.16602 2.16406 11.8665 2.16406 23.8327C2.16406 35.7989 11.8646 45.4993 23.8307 45.4993Z" fill="white" stroke="white" stroke-width="2" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 23.8333C0 36.9958 10.6708 47.6667 23.8333 47.6667C36.9958 47.6667 47.6667 36.9958 47.6667 23.8333C47.6667 10.6708 36.9958 0 23.8333 0V4.33333C27.6901 4.33333 31.4602 5.47699 34.667 7.61968C37.8737 9.76236 40.3731 12.8078 41.849 16.371C43.3249 19.9342 43.7111 23.855 42.9586 27.6376C42.2062 31.4202 40.349 34.8948 37.6219 37.6219C34.8948 40.349 31.4202 42.2062 27.6376 42.9586C23.855 43.7111 19.9342 43.3249 16.371 41.849C12.8078 40.3731 9.76236 37.8737 7.61968 34.667C5.47699 31.4602 4.33333 27.6901 4.33333 23.8333H0Z" fill="#FFB74D" />
          </svg>
          <h1 className="text-[34px] font-light text-black">We're <span className="font-bold">Working</span> on it!</h1>
        </div>
        <p className="text-[#535352] font-medium text-base text-center">
          This section is currently under development to provide a clear<br /> and organized overview of all relevant details.”
        </p>
      </div>

      <img
        src={background}
        alt="background"
        className="pointer-events-none  scale-x-[-1] absolute bottom-0 w-[120%] max-w-none object-cover right-0 sm:w-auto translate-x-0 sm:h-[50dvh] lg:h-[58dvh]"
      />
    </div>
  );
};

export default NotFound;