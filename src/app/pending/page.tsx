import Link from "next/link";
import { Clock, Building2 } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-stone-900 font-bold">Wecool Payroll</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Account Pending Approval</h1>
        <p className="text-stone-500 mb-2">
          Your registration was successful. Our HR team will review and approve your account within 1–2 business days.
        </p>
        <p className="text-stone-400 text-sm mb-8">You will receive an in-portal notification once approved.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-6">
          <h3 className="text-sm font-bold text-amber-800 mb-2">What happens next?</h3>
          <ol className="space-y-1.5 text-sm text-amber-700">
            <li>① HR reviews your submitted information</li>
            <li>② Your account gets approved and configured</li>
            <li>③ You can log in and access your portal</li>
          </ol>
        </div>
        <Link href="/login">
          <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all">
            Back to Sign In
          </button>
        </Link>
      </div>
    </div>
  );
}
