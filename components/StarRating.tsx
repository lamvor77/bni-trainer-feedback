"use client";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  error?: boolean;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function StarRating({ value, onChange, label, error }: StarRatingProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3"
    >
      {STAR_VALUES.map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star}점`}
            onClick={() => onChange(star)}
            className={`flex h-12 w-12 flex-1 items-center justify-center rounded-xl transition-colors sm:flex-none ${
              error ? "bg-red-50" : "bg-transparent"
            } active:bg-zinc-100`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-8 w-8 transition-colors ${
                filled ? "fill-red-600 text-red-600" : "fill-transparent text-zinc-300"
              }`}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L12 16.9l-5.21 2.74 1-5.79-4.21-4.1 5.82-.85L12 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
