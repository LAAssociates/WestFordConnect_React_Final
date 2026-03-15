import React from 'react';

interface HighlightTextProps {
    text: string;
    highlight: string;
    highlightClassName?: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({
    text,
    highlight,
    highlightClassName = "bg-yellow-200 text-black font-semibold rounded-sm"
}) => {
    if (!highlight || !highlight.trim()) {
        return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className={highlightClassName}>
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default HighlightText;
