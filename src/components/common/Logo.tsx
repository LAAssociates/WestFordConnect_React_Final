import React from 'react';
import logo from '../../assets/images/logo.png';

interface LogoProps {
  /**
   * Width of the logo in pixels
   * @default 199
   */
  width?: number;
  /**
   * Height of the logo in pixels
   * @default 69
   */
  height?: number;
  /**
   * Additional CSS classes to apply to the logo
   */
  className?: string;
  /**
   * Alt text for the logo image
   * @default "Westford Connect Logo"
   */
  alt?: string;
  /**
   * Whether to center the logo horizontally
   * @default false
   */
  centered?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  width = 199,
  height = 69,
  className = '',
  alt = 'Westford Connect Logo',
  centered = false,
}) => {
  const baseClasses = 'block';
  const centeredClasses = centered ? 'mx-auto' : '';
  const combinedClasses = `${baseClasses} ${centeredClasses} ${className}`.trim();

  return (
    <img
      src={logo}
      alt={alt}
      width={width}
      height={height}
      className={combinedClasses}
    />
  );
};

export default Logo;
