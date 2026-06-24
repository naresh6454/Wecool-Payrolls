export default function ReviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="h-7 w-64 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-80 bg-stone-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-stone-200 rounded-xl" />
          <div className="h-9 w-48 bg-stone-200 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 h-20" />
        ))}
      </div>
    </div>
  );
}
