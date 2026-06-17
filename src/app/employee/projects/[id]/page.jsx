import ProjectBoard from "@/components/tasks/ProjectBoard";

export const metadata = {
    title: "Project Board | Employee Portal",
    description: "View and manage tasks for your assigned project",
};

export default function EmployeeProjectBoardPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <ProjectBoard />
        </div>
    );
}
