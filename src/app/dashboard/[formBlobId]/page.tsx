import DashboardPageClient from "./dashboard-page-client";

export async function generateStaticParams() {
  return [{ formBlobId: "_" }];
}

export default function FormDetailPage() {
  return <DashboardPageClient />;
}
