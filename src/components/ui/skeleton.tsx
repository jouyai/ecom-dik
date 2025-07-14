export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className || ""}`}
      style={{ minHeight: 20 }}
    />
  );
}

export default Skeleton; 