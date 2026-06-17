'use server';

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";

export async function deleteSalaryComponent(rawId) {
    try {
        const id = String(rawId);

        if (!id || id === 'undefined') {
            console.error("❌ Server Action: Missing ID");
            return { success: false, error: "Invalid ID provided" };
        }

        console.log(`🗑️ Server Action processing delete for ID: ${id}`);

        // Find the component first
        const component = await prisma.salaryComponent.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!component) {
            console.warn(`⚠️ Component ${id} not found`);
            return { success: false, error: "Component not found" };
        }

        await prisma.salaryComponent.delete({
            where: { id: component.id }
        });

        // Log locally
        console.log("✅ Component deleted from DB");

        // Attempt activity log (non-blocking)
        try {
            await logActivity({
                action: "deleted",
                entity: "SalaryComponent",
                entityId: component.name,
                description: `Deleted salary component: ${component.name}`,
                performedBy: { userId: "system" }
            });
        } catch (e) {
            console.error("Log failed:", e.message);
        }

        revalidatePath("/dashboard/payroll/components");
        return { success: true, message: "Deleted successfully" };

    } catch (error) {
        console.error("❌ Server Action Fatal Error:", error);
        return { success: false, error: error.message };
    }
}
