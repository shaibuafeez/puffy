import FormPageClient from "./form-page-client";

export async function generateStaticParams() {
  return [{ formBlobId: "_" }];
}

export default function FormPage() {
  return <FormPageClient />;
}
