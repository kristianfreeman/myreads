interface BookCoverProps {
  src?: string;
  alt: string;
  className?: string;
}

export function BookCover({ src, alt, className = "" }: BookCoverProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          // If image fails to load, hide it and show placeholder
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  return (
    <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
      <svg
        className="w-12 h-16 text-gray-400 dark:text-gray-600"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        <path d="M4 6.5C4 5.67 4.67 5 5.5 5H18c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5H5.5c-.83 0-1.5-.67-1.5-1.5v-11zM6 7v10h12V7H6z"/>
        <path d="M8 9h8v1H8zm0 2h8v1H8zm0 2h5v1H8z"/>
      </svg>
    </div>
  );
}

// Wrapper for images with fallback
export function BookCoverWithFallback({ src, alt, className = "" }: BookCoverProps) {
  return (
    <div className="relative">
      {src && (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      )}
      <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${src ? 'hidden' : ''}`}>
        <svg
          className="w-12 h-16 text-gray-400 dark:text-gray-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
          <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
        </svg>
      </div>
    </div>
  );
}