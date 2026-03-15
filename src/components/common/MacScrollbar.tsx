import React, { forwardRef, useEffect, useRef } from 'react';
import { MacScrollbar as MacScrollbarComponent } from 'mac-scrollbar';
import type { MacScrollbarProps } from 'mac-scrollbar';

interface MacScrollbarWrapperProps extends Omit<MacScrollbarProps, 'as'> {
    children: React.ReactNode;
    className?: string;
}

const MacScrollbar = forwardRef<HTMLDivElement, MacScrollbarWrapperProps>(
    ({ children, className, ...props }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            // mac-scrollbar renders the scrollable element, find it after mount
            const findScrollableElement = () => {
                if (!containerRef.current) return null;

                // mac-scrollbar typically creates a scrollable wrapper
                // Look for the element with scroll capabilities
                const allDivs = containerRef.current.querySelectorAll('div');
                for (const div of Array.from(allDivs)) {
                    const style = window.getComputedStyle(div);
                    if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                        style.overflow === 'auto' || style.overflow === 'scroll') {
                        return div as HTMLDivElement;
                    }
                }

                // Fallback: return the container or first child
                return (containerRef.current.firstElementChild as HTMLDivElement) || containerRef.current;
            };

            // Use requestAnimationFrame to ensure DOM is ready
            const rafId = requestAnimationFrame(() => {
                const scrollable = findScrollableElement();
                if (scrollable) {
                    if (typeof ref === 'function') {
                        ref(scrollable);
                    } else if (ref) {
                        ref.current = scrollable;
                    }
                }
            });

            return () => cancelAnimationFrame(rafId);
        }, [ref]);

        return (
            <MacScrollbarComponent
                {...props}
                as="div"
                ref={containerRef}
                className={className}
            >
                {children}
            </MacScrollbarComponent>
        );
    }
);

MacScrollbar.displayName = 'MacScrollbar';

export default MacScrollbar;
