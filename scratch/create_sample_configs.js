const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🚀 Creating sample admin NotificationConfig records...');
    
    const orgId = '1713d3da-2293-43c2-a7f9-c15a35b9c453';
    
    // Check if we already have records
    const count = await prisma.notificationConfig.count();
    if (count > 0) {
      console.log(`Already have ${count} records. Skipping creation.`);
      return;
    }
    
    const configs = [
      {
        configData: {
          type: "system",
          title: "Quarterly Planning Meeting",
          message: "All department leads are requested to submit their progress presentations by Friday.",
          priority: "high",
          audienceType: "organization",
          organization: orgId
        }
      },
      {
        configData: {
          type: "document-reminder",
          title: "Mandatory Compliance Sign-off",
          message: "Please review and sign off the new workplace safety document in the handbook section.",
          priority: "medium",
          audienceType: "organization",
          organization: orgId
        }
      },
      {
        configData: {
          type: "threshold-exceeded",
          title: "Server Upgraded Successfully",
          message: "Our primary application server has been successfully upgraded to the latest version.",
          priority: "low",
          audienceType: "organization",
          organization: orgId
        }
      }
    ];
    
    for (const config of configs) {
      const created = await prisma.notificationConfig.create({
        data: {
          configData: config.configData
        }
      });
      console.log(`✅ Created config: ${created.id} - "${config.configData.title}"`);
    }
    
  } catch (error) {
    console.error('❌ Error creating sample configs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
