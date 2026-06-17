import MyTasks from "@/components/tasks/my-tasks";

export const metadata = {
    title: "My Tasks | Employee Portal",
    description: "View and manage your personal tasks",
};

export default function EmployeeMyTasksPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <MyTasks />
        </div>
    );
}
