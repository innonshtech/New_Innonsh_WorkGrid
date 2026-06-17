import EmployeeDetail from '@/components/payroll/employee-detail';

export default async  function EmployeeDetailPage({ params }) {
   const { id } = await params;
  return <EmployeeDetail employeeId={id} />;
}