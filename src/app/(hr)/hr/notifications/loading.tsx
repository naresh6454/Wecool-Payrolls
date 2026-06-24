export default function NotificationsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-44 bg-stone-200 rounded-lg mb-2" />
        <div className="h-4 w-60 bg-stone-100 rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-16" />
        ))}
      </div>
    </div>
  );
}
