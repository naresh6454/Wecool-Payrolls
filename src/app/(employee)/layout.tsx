import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user || user.role !== "EMPLOYEE") redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status !== "APPROVED") redirect("/login");

  const notifCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  const name = user.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user.email;

  return (
    <div className="flex min-h-screen bg-[#F7F6F3]">
      <Sidebar role="EMPLOYEE" userName={name} userEmail={user.email} notifCount={notifCount} />
      <main className="flex-1 lg:ml-56 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
