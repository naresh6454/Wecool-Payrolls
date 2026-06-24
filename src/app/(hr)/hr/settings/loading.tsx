export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-32 bg-stone-200 rounded-lg mb-2" />
        <div className="h-4 w-48 bg-stone-100 rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-28" />
        ))}
      </div>
    </div>
  );
}
