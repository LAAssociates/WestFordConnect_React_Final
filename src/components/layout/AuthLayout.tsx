import React from 'react';
import Logo from '../common/Logo';
import background from '../../assets/images/auth-background.png';

interface AuthLayoutProps {
  heading: React.ReactNode;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ heading, children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1C2745]">
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <div className="flex flex-1 flex-col items-stretch gap-10 px-5 py-10 sm:px-10 sm:py-14 lg:flex-row lg:items-start lg:justify-center lg:gap-[120px] lg:px-24 lg:py-[180px]">
          {heading ? (
            <div className="mt-4 text-center lg:mt-[30px] lg:text-left">{heading}</div>
          ) : null}
          <div className="mx-auto w-full max-w-[480px] rounded-[20px] bg-white px-6 py-8 shadow-lg sm:px-10 sm:py-12 lg:mx-0">
            <Logo centered />
            <div className="relative mt-5 mb-10 h-px w-full bg-[#E6E6E6]">
              <div className="absolute top-1/2 left-0 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E6E6E6]"></div>
              <div className="absolute top-1/2 left-full h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E6E6E6]"></div>
            </div>
            <div className="w-full">{children}</div>
          </div>
        </div>

        <div className="px-5 pb-5 text-center text-sm font-normal text-white sm:px-10">© 2025 Westford Connect. All Rights Reserved</div>
      </div>

      <img
        src={background}
        alt="background"
        className="pointer-events-none absolute bottom-0 left-1/2 w-[120%] max-w-none -translate-x-1/2 object-cover sm:left-0 sm:w-auto sm:translate-x-0 sm:h-[50dvh] lg:h-[58dvh]"
      />
    </div>
  );
};

export default AuthLayout;