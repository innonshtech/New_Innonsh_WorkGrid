import prisma from "@/lib/db/prisma";

/**
 * Logs an activity to the database.
 * 
 * @param {string} action - The action performed (e.g., 'created', 'updated', 'deleted')
 * @param {string} entity - The entity being acted upon (e.g., 'Employee', 'Payslip')
 * @param {string} description - Human readable description
 * @param {string} entityId - (Optional) ID of the entity
 * @param {Object} performedBy - (Optional) User info { userId, name, email, role }
 * @param {Object} details - (Optional) Additional details/metadata
 * @param {string} status - (Optional) 'success' or 'failed', defaults to 'success'
 * @param {Request} req - (Optional) The Next.js request object to extract IP/UserAgent
 */
export async function logActivity({
  action,
  entity,
  description,
  entityId = null,
  performedBy = null,
  details = null,
  status = "success",
  req = null,
}) {
  try {
    let ipAddress = "Unknown";
    let userAgent = "Unknown";

    if (req) {
      ipAddress = req.headers.get("x-forwarded-for") || "Unknown";
      userAgent = req.headers.get("user-agent") || "Unknown";
    }

    // Clean up performedBy.userId
    const cleanPerformedBy = performedBy ? { ...performedBy } : { name: "System" };

    const logEntry = {
      action,
      entity,
      entityId,
      description,
      performedBy: cleanPerformedBy,
      details,
      status,
      ipAddress,
      userAgent,
    };

    const log = await prisma.activityLog.create({
      data: {
        action,
        module: entity || "System",
        userId: cleanPerformedBy.userId || null,
        logData: logEntry
      }
    });

    console.log(`[ActivityLog] ${action} ${entity}: ${description}`);
    return log;
  } catch (error) {
    console.error("[ActivityLog] Failed to save log:", error);
    // Silent fail to not disrupt main flow
    return null;
  }
}
