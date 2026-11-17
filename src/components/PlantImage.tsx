import { useState } from 'react';
import { Sprout } from 'lucide-react';

interface PlantImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PlantImage({ src, alt, className = '' }: PlantImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-[#EAF4EC] via-[#F2F8F3] to-[#DCECE0] flex flex-col items-center justify-center text-[#1E4D35] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sprout className="w-10 h-10 text-[#15803D] mb-2" strokeWidth={1.6} />
        <span className="text-xs font-medium text-[#2F5E43] px-3 text-center truncate max-w-full">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover bg-[#EAF4EC] ${className}`}
    />
  );
}
