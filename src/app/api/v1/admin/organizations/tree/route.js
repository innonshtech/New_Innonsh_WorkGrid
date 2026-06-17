import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);
    
    // 1. Fetch Organizations
    const filter = {};
    if (authUser.role !== "super_admin" && authUser.organizationId) {
      filter.id = authUser.organizationId;
    }
    
    const organizations = await prisma.organization.findMany({ where: filter });
    
    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orgIds = organizations.map(org => org.id);

    // 2. Fetch all related entities in parallel using Prisma in query syntax
    const [businessUnits, departments, teams] = await Promise.all([
      prisma.businessUnit.findMany({ 
        where: { 
          organizationId: { in: orgIds }, 
          status: "Active" 
        } 
      }),
      prisma.department.findMany({ 
        where: { 
          organizationId: { in: orgIds }, 
          status: "Active" 
        } 
      }),
      prisma.team.findMany({ 
        where: { 
          status: "Active" 
        } 
      })
    ]);

    // Helper to format employee name
    const formatName = (emp) => {
      if (!emp) return null;
      if (emp.personalDetails && typeof emp.personalDetails === "object" && emp.personalDetails.firstName) {
        return `${emp.personalDetails.firstName} ${emp.personalDetails.lastName || ''}`.trim();
      }
      return emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : "Unknown";
    };

    // 3. Build the hierarchical tree
    const tree = organizations.map(org => {
      const orgIdStr = org.id;

      // Find BUs for this Org
      const orgBUs = businessUnits.filter(bu => bu.organizationId === org.id || bu.organizationId === org.mongoId);
      
      // Find Departments for this Org
      const orgDepts = departments.filter(dept => dept.organizationId === org.id || dept.organizationId === org.mongoId);

      const buNodes = orgBUs.map(bu => {
        const buIdStr = bu.id;
        // Find Depts belonging to this BU
        const buDepts = orgDepts.filter(dept => dept.businessUnitId === bu.id || dept.businessUnitId === bu.mongoId);
        
        const deptNodes = buDepts.map(dept => {
          const deptIdStr = dept.id;
          // Find Teams belonging to this Dept
          const deptTeams = teams.filter(team => team.departmentId === dept.id || team.departmentId === dept.mongoId);
          
          const teamNodes = deptTeams.map(team => {
            const leadData = team.modelData && typeof team.modelData === 'object' ? team.modelData.teamLead : null;
            return {
              name: team.teamName,
              type: "team",
              head: leadData ? { name: formatName(leadData) } : null,
              children: []
            };
          });

          return {
            name: dept.departmentName,
            type: "department",
            head: null, // Department model currently lacks a head field
            children: teamNodes
          };
        });

        const buLead = bu.modelData && typeof bu.modelData === 'object' ? bu.modelData.headOfUnit : null;

        return {
          name: bu.unitName,
          type: "businessUnit",
          head: buLead ? { name: formatName(buLead) } : null,
          children: deptNodes
        };
      });

      // Handle standalone departments (not assigned to a BU)
      const standaloneDepts = orgDepts.filter(dept => !dept.businessUnitId);
      const standaloneDeptNodes = standaloneDepts.map(dept => {
        const deptIdStr = dept.id;
        const deptTeams = teams.filter(team => team.departmentId === dept.id || team.departmentId === dept.mongoId);
        
        const teamNodes = deptTeams.map(team => {
          const leadData = team.modelData && typeof team.modelData === 'object' ? team.modelData.teamLead : null;
          return {
            name: team.teamName,
            type: "team",
            head: leadData ? { name: formatName(leadData) } : null,
            children: []
          };
        });

        return {
          name: dept.departmentName,
          type: "department",
          head: null,
          children: teamNodes
        };
      });

      return {
        name: org.name,
        type: "organization",
        head: null, // Organization head/CEO could be added here if in schema
        children: [...buNodes, ...standaloneDeptNodes]
      };
    });

    return NextResponse.json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error("GET ORG TREE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
