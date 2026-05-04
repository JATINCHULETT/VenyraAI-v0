import Image from "next/image";

type VenyraLogoMarkProps = {
  /** Pixel size (width and height). */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Brand mark from `/public/brand/venyra-logo.png` (transparent PNG).
 */
export function VenyraLogoMark({ size = 32, className = "", priority = false }: VenyraLogoMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/venyra-logo.png"
        alt="Venyra"
        width={size}
        height={size}
        className="object-contain"
        priority={priority}
        sizes={`${size}px`}
      />
    </span>
  );
}
