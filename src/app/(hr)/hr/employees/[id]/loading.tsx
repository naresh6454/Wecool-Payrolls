export default function EmployeeDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 bg-stone-200 rounded-lg mb-6" />
      <div className="bg-white rounded-2xl border border-stone-100 p-6 flex gap-6 items-center">
        <div className="w-20 h-20 rounded-full bg-stone-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 bg-stone-200 rounded" />
          <div className="h-4 w-32 bg-stone-100 rounded" />
          <div className="h-4 w-56 bg-stone-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-100 h-48" />
        <div className="bg-white rounded-2xl border border-stone-100 h-48" />
      </div>
    </div>
  );
}
