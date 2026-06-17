import TimesheetApprovals from "@/components/tasks/TimesheetApprovals";

export const metadata = {
    title: "Timesheet Approvals | HR System",
    description: "Review and approve employee timesheets",
};

export default function ApprovalsPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <TimesheetApprovals />
        </div>
    );
}
