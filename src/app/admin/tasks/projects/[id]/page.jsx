import ProjectBoard from "@/components/tasks/ProjectBoard";

export const metadata = {
    title: "Project Board | HR System",
    description: "Kanban board and task management for your project",
};

export default function ProjectDetailPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <ProjectBoard />
        </div>
    );
}
