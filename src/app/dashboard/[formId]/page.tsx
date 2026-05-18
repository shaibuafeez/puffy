import DashboardPageClient from "./dashboard-page-client";

export async function generateStaticParams() {
  return [{ formId: "_" }];
}

export default function FormDetailPage() {
  return <DashboardPageClient />;
}
