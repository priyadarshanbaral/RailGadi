export const SkeletonCard = () => (
  <div className="glass-card skeleton-card">
    <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 14, width: "90%", marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 30, width: "100%" }} />
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="grid grid-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div className="glass-card" key={i}>
        <div className="skeleton" style={{ height: 16, width: "50%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 40, width: "70%" }} />
      </div>
    ))}
  </div>
);
