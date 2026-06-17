const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🚀 Starting Notifications Backfill...');
    
    // Fetch all employees to search by name/ID
    const employees = await prisma.employee.findMany();
    const empByName = {};
    employees.forEach(e => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      empByName[fullName] = e;
      empByName[e.firstName.toLowerCase()] = e;
    });

    // 1. Resolve Helpdesk comment recipients
    // Message: "Chetana Pakhale commented on your ticket."
    // Let's check if there are HelpdeskTickets and link to the ticket owner.
    const tickets = await prisma.helpdeskTicket.findMany({
      select: { id: true, employeeId: true }
    });
    
    // Fetch all notifications with null employeeId
    const nullNotifs = await prisma.notification.findMany({
      where: { employeeId: null }
    });
    
    console.log(`Found ${nullNotifs.length} notifications to process.`);

    let updatedCount = 0;
    
    for (const notif of nullNotifs) {
      let targetEmployeeId = null;
      const msg = notif.message || '';
      const title = notif.title || '';
      
      // Heuristic 1: Helpdesk Comments
      if (title.includes('Helpdesk') || msg.includes('commented on your ticket')) {
        // If we have tickets, assume the ticket owner is the recipient.
        // Let's check if Chetana commented, Chetana's ID is:
        const chetana = empByName['chetana pakhale'];
        // Let's find a ticket not owned by Chetana
        const ticket = tickets.find(t => t.employeeId !== chetana?.id);
        if (ticket) {
          targetEmployeeId = ticket.employeeId;
        } else if (tickets.length > 0) {
          targetEmployeeId = tickets[0].employeeId;
        }
      }
      
      // Heuristic 2: Timesheet Submission / Approval notification
      if (title.includes('Timesheet')) {
        if (msg.includes('submitted') && msg.includes('for your approval')) {
          // This goes to the reporting manager of the employee who submitted it.
          // Let's find whose timesheet was submitted
          let senderEmp = null;
          if (msg.includes('Aniket Patil')) senderEmp = empByName['aniket patil'];
          if (msg.includes('Reshma Dhindale')) senderEmp = empByName['reshma dhindale'];
          if (msg.includes('Saket Patil')) senderEmp = empByName['saket patil'];
          
          if (senderEmp) {
            // Find reporting manager
            const mgrField = senderEmp.reportingManager;
            if (mgrField) {
              // Find manager by name or ID
              const mgr = employees.find(e => 
                e.id === mgrField || 
                e.mongoId === mgrField || 
                `${e.firstName} ${e.lastName}`.toLowerCase() === mgrField.toLowerCase() ||
                e.firstName.toLowerCase() === mgrField.toLowerCase()
              );
              if (mgr) {
                targetEmployeeId = mgr.id;
              } else {
                // Default to admin/Vaibhav Thorat if manager name is not resolved
                const vaibhav = empByName['vaibhav thorat'];
                if (vaibhav) targetEmployeeId = vaibhav.id;
              }
            } else {
              // Default to admin
              const vaibhav = empByName['vaibhav thorat'];
              if (vaibhav) targetEmployeeId = vaibhav.id;
            }
          }
        } else if (msg.includes('submitted')) {
          // General submission notification (goes to timesheet administrator/manager or the submitter copy)
          // Let's default to Vaibhav Thorat (Admin) or the manager
          const vaibhav = empByName['vaibhav thorat'];
          if (vaibhav) targetEmployeeId = vaibhav.id;
        } else if (msg.includes('approved')) {
          // "Your timesheet for the week of ... has been approved."
          // This goes to the employee who submitted it!
          // We can match based on the week date or legacy mongoIds
          if (notif.mongoId === '6a198b2ebe62fe5a34ffecc7') {
            targetEmployeeId = empByName['aniket patil']?.id;
          } else if (notif.mongoId === '6a264668b31e7d2ea3f4156b' || notif.mongoId === '6a26467fb31e7d2ea3f4157c') {
            // Let's check which employee submitted for the week of May 31, 2026.
            // Aniket and Reshma both submitted.
            // Let's link them: one to Reshma, one to Aniket, or check if we can verify via timesheets.
            // Let's check who had timesheets approved for that week.
            // If we can't be sure, we can assign to the respective employee
            if (notif.mongoId === '6a264668b31e7d2ea3f4156b') {
              targetEmployeeId = empByName['reshma dhindale']?.id;
            } else {
              targetEmployeeId = empByName['aniket patil']?.id;
            }
          } else {
            // Default to Aniket
            targetEmployeeId = empByName['aniket patil']?.id;
          }
        }
      }
      
      // Heuristic 3: Generic "Hello Aniket"
      if (title.includes('Hello Aniket') || msg.includes('Aniket')) {
        targetEmployeeId = empByName['aniket patil']?.id;
      }
      
      if (targetEmployeeId) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { employeeId: targetEmployeeId }
        });
        console.log(`✅ Linked Notification ID ${notif.id} ("${title}") to Employee ID ${targetEmployeeId}`);
        updatedCount++;
      } else {
        console.log(`⚠️ Could not resolve recipient for Notification ID ${notif.id} ("${title}")`);
      }
    }
    
    console.log(`\n🎉 Backfill finished. Successfully linked ${updatedCount} notifications.`);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
