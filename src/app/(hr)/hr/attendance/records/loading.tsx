export default function AttendanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-52 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-44 bg-stone-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-stone-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 mb-6 h-48" />
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="bg-stone-50 h-12 border-b border-stone-100" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-3 border-b border-stone-50">
            <div className="w-32 h-4 bg-stone-100 rounded" />
            <div className="w-24 h-4 bg-stone-100 rounded" />
            <div className="w-16 h-4 bg-stone-100 rounded" />
            <div className="w-16 h-4 bg-stone-100 rounded" />
            <div className="w-12 h-4 bg-stone-100 rounded" />
            <div className="w-16 h-5 bg-stone-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
