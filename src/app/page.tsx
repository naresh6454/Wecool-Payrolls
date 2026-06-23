import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "HR") redirect("/hr/dashboard");
  redirect("/employee/dashboard");
}
