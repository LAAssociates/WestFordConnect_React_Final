import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'right',
  delay = 500,
  className,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [computedSide, setComputedSide] = useState<typeof side>(side);
  const [position, setPosition] = useState<{ top: number; left: number; transformOrigin: string }>({
    top: 0,
    left: 0,
    transformOrigin: 'center'
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsClient(true);

    return () => {
      setIsClient(false);
    };
  }, []);

  const showTooltip = () => {
    if (disabled) {
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      const next = calculatePosition(side);

      if (next) {
        setComputedSide(next.side);
        setPosition({
          top: next.top,
          left: next.left,
          transformOrigin: next.transformOrigin
        });
      }

      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (disabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVisible(false);
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setComputedSide(side);
  }, [side]);

  const computeTransformOrigin = useCallback((currentSide: typeof side) => {
    switch (currentSide) {
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      case 'top':
        return 'center bottom';
      case 'bottom':
        return 'center top';
      default:
        return 'center';
    }
  }, []);

  const calculatePosition = useCallback(
    (preferredSide: typeof side) => {
      if (!triggerRef.current || !tooltipRef.current || typeof window === 'undefined') {
        return null;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const offset = 8;
      const viewportPadding = 8;

      let nextSide = preferredSide;
      let top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      let left = triggerRect.right + offset;

      const fitsRight = triggerRect.right + offset + tooltipRect.width <= window.innerWidth - viewportPadding;
      const fitsLeft = triggerRect.left - offset - tooltipRect.width >= viewportPadding;
      const fitsTop = triggerRect.top - offset - tooltipRect.height >= viewportPadding;
      const fitsBottom = triggerRect.bottom + offset + tooltipRect.height <= window.innerHeight - viewportPadding;

      switch (preferredSide) {
        case 'left':
          left = triggerRect.left - tooltipRect.width - offset;
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          if (!fitsLeft && fitsRight) {
            nextSide = 'right';
            left = triggerRect.right + offset;
          }
          break;
        case 'top':
          top = triggerRect.top - tooltipRect.height - offset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          if (!fitsTop && fitsBottom) {
            nextSide = 'bottom';
            top = triggerRect.bottom + offset;
          }
          break;
        case 'bottom':
          top = triggerRect.bottom + offset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          if (!fitsBottom && fitsTop) {
            nextSide = 'top';
            top = triggerRect.top - tooltipRect.height - offset;
          }
          break;
        case 'right':
        default:
          left = triggerRect.right + offset;
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          if (!fitsRight && fitsLeft) {
            nextSide = 'left';
            left = triggerRect.left - tooltipRect.width - offset;
          }
          break;
      }

      if (nextSide === 'right' || nextSide === 'left') {
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));
      } else {
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
      }

      return {
        top,
        left,
        side: nextSide,
        transformOrigin: computeTransformOrigin(nextSide)
      };
    },
    [computeTransformOrigin]
  );

  const updatePosition = useCallback(() => {
    const next = calculatePosition(side);

    if (!next) {
      return;
    }

    setComputedSide(next.side);
    setPosition({
      top: next.top,
      left: next.left,
      transformOrigin: next.transformOrigin
    });
  }, [calculatePosition, side]);

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') {
      return;
    }

    const handleUpdate = () => {
      window.requestAnimationFrame(updatePosition);
    };

    handleUpdate();

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isVisible, updatePosition]);

  const getTooltipClasses = () => {
    const baseClasses = 'fixed z-50 px-[7px] py-[5px] text-xs font-semibold text-white bg-[#232725] rounded-xs shadow-lg pointer-events-none transition-opacity transition-transform duration-200 ease-out whitespace-nowrap';
    const visibilityClasses = isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95';

    return `${baseClasses} ${visibilityClasses}`;
  };

  const getArrowClasses = () => {
    const baseArrow = "absolute w-0 h-0";
    switch (computedSide) {
      case 'right':
        return `${baseArrow} border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-black left-[-6px] top-1/2 -translate-y-1/2`;
      case 'left':
        return `${baseArrow} border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-black right-[-6px] top-1/2 -translate-y-1/2`;
      case 'top':
        return `${baseArrow} border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-black bottom-[-6px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-black top-[-6px] left-1/2 -translate-x-1/2`;
      default:
        return '';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isClient
        ? createPortal(
            <div
              ref={tooltipRef}
              className={cn(getTooltipClasses(), className)}
              style={{
                top: position.top,
                left: position.left,
                transformOrigin: position.transformOrigin
              }}
              aria-hidden={!isVisible}
            >
              {content}
              <div className={getArrowClasses()} />
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default Tooltip;
