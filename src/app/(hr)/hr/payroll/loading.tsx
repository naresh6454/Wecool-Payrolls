export default function PayrollLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-44 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-56 bg-stone-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-stone-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-40" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="bg-stone-50 h-12 border-b border-stone-100" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-50">
            <div className="w-28 h-4 bg-stone-200 rounded" />
            <div className="w-24 h-4 bg-stone-100 rounded" />
            <div className="w-32 h-4 bg-stone-100 rounded" />
            <div className="flex-1" />
            <div className="w-20 h-5 bg-stone-100 rounded-full" />
            <div className="w-16 h-8 bg-stone-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
