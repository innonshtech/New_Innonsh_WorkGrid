import PayslipView from '@/components/payroll/payslip-view';

export default async function PayslipViewPage({ params }) {
  const {id} = await params
  console.log("Rendering PayslipViewPage for payslip ID:", id);
  return <PayslipView payslipId={id} />;
}