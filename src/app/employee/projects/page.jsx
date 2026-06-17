import ProjectManagement from "@/components/tasks/ProjectManagement";

export const metadata = {
    title: "Project Management | HR System",
    description: "Manage projects and team assignments",
};

export default function ProjectsPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <ProjectManagement />
        </div>
    );
}
