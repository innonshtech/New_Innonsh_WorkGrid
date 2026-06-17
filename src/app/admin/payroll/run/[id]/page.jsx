import { PayrollRunReview } from "@/components/payroll/payroll-run-review";

export default async function PayrollRunReviewPage({ params }) {
  const { id } = await params;
  return <PayrollRunReview runId={id} />;
}
