import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getMovimientos } from "@/lib/queries";

export default async function DashboardPage() {
  const movements = await getMovimientos();
  return <DashboardView movements={movements} />;
}
