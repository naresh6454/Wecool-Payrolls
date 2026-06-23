export default function EmployeesLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-56 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-40 bg-stone-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-stone-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="bg-stone-50 h-12 border-b border-stone-100" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-stone-50">
            <div className="w-20 h-4 bg-stone-100 rounded" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-stone-200" />
              <div>
                <div className="h-4 w-32 bg-stone-200 rounded mb-1" />
                <div className="h-3 w-40 bg-stone-100 rounded" />
              </div>
            </div>
            <div className="w-16 h-5 bg-stone-100 rounded-full" />
            <div className="w-24 h-4 bg-stone-100 rounded" />
            <div className="w-24 h-4 bg-stone-100 rounded" />
            <div className="w-20 h-4 bg-stone-100 rounded" />
            <div className="w-16 h-5 bg-stone-100 rounded-full" />
            <div className="w-20 h-4 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
