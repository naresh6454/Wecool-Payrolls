export default function CalendarLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-stone-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 bg-stone-200 rounded-lg" />
          <div className="h-9 w-24 bg-stone-200 rounded-lg" />
        </div>
      </div>
      <div className="flex justify-between mb-6">
        <div className="h-8 w-40 bg-stone-100 rounded-lg" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-5 w-28 bg-stone-100 rounded" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-44" />
        ))}
      </div>
    </div>
  );
}
