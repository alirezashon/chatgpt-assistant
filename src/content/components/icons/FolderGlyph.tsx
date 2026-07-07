interface FolderGlyphProps {
  readonly icon: string;
}

export function FolderGlyph({ icon }: FolderGlyphProps) {
  if (icon === 'briefcase') {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-9 4h12M5.75 7.75h12.5v10.5H5.75z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === 'bookmark') {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.75 5.75a2 2 0 0 1 2-2h4.5a2 2 0 0 1 2 2v14l-4.25-2.5-4.25 2.5z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h3.25l2 2h3.75a2.75 2.75 0 0 1 2.75 2.75v6.75a2.75 2.75 0 0 1-2.75 2.75h-9A2.75 2.75 0 0 1 4.75 16.5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
