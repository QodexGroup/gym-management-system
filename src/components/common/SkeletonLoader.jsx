/**
 * Skeleton loading placeholder — replaces "Loading..." text across the app.
 *
 * Usage:
 *   <SkeletonLoader />                          — single line
 *   <SkeletonLoader rows={4} />                 — 4 stacked lines
 *   <SkeletonLoader type="card" />              — card block
 *   <SkeletonLoader type="table" rows={5} />    — table rows
 *   <SkeletonLoader type="avatar" />            — circular avatar
 */

const pulse = 'animate-pulse bg-dark-700 rounded';

const Line = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`${pulse} ${width} ${height}`} />
);

const Avatar = ({ size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
  return <div className={`${pulse} rounded-full flex-shrink-0 ${sizes[size] ?? sizes.md}`} />;
};

const Card = () => (
  <div className="card space-y-3">
    <Line width="w-1/3" height="h-5" />
    <Line width="w-full" />
    <Line width="w-5/6" />
    <Line width="w-2/3" />
  </div>
);

const TableRows = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Line width="w-8" height="h-4" />
        <Line width="w-1/4" />
        <Line width="w-1/3" />
        <Line width="w-1/5" />
        <Line width="w-16" />
      </div>
    ))}
  </div>
);

const Lines = ({ rows = 1 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Line key={i} width={i % 3 === 2 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
);

const SkeletonLoader = ({ type = 'lines', rows = 1, size, className = '' }) => {
  const content = (() => {
    switch (type) {
      case 'card':   return <Card />;
      case 'table':  return <TableRows rows={rows} />;
      case 'avatar': return <Avatar size={size} />;
      default:       return <Lines rows={rows} />;
    }
  })();

  return <div className={className}>{content}</div>;
};

export default SkeletonLoader;
