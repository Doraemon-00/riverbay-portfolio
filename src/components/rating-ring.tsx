export function RatingRing({ level }: { level: number | null }) {
  return (
    <svg className="rating-ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="ring-track" cx="32" cy="32" r="24" pathLength="100" />
      <circle
        className={`ring-fill ring-level-${level ?? 0}`}
        cx="32"
        cy="32"
        r="24"
        pathLength="100"
        strokeDasharray={`${level === 3 ? 98 : level === 2 ? 66 : level === 1 ? 32 : 0} 100`}
      />
    </svg>
  );
}
