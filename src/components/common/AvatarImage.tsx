import React from "react";
import { cn } from "../../lib/utils/cn";
import { optimizeAvatarUrl } from "../../lib/utils/avatar";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
  loading?: "eager" | "lazy";
  decoding?: "sync" | "async" | "auto";
}

const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 48,
  className,
  fallbackSrc,
  loading = "lazy",
  decoding = "async",
}) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const optimizedSrc = React.useMemo(() => optimizeAvatarUrl(src, size * 2), [src, size]);
  const finalSrc = !hasError ? optimizedSrc : undefined;
  const initial = (alt || "U").trim().charAt(0).toUpperCase();

  if (!finalSrc && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  if (!finalSrc) {
    return (
      <div
        className={cn(
          "rounded-full bg-blue-500 text-white font-medium flex items-center justify-center",
          className
        )}
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={cn("rounded-full object-cover", className)}
    />
  );
};

export default AvatarImage;

