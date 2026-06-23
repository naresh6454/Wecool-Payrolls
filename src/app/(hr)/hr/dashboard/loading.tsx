export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-48 bg-stone-200 rounded-lg mb-2" />
        <div className="h-4 w-72 bg-stone-100 rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 h-28" />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-100 h-64" />
        <div className="bg-white rounded-2xl border border-stone-100 h-64" />
      </div>
    </div>
  );
}
