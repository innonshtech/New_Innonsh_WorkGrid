const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://gaikwadsameer422_db_user:vYkPEmN1wMSaEKd9@cluster0.fqf0bni.mongodb.net/?appName=Cluster0";

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Simple Schemas for seeding
        const Organization = mongoose.models.Organization || mongoose.model('Organization', new mongoose.Schema({ name: String }));
        const BusinessUnit = mongoose.models.BusinessUnit || mongoose.model('BusinessUnit', new mongoose.Schema({ name: String, organizationId: mongoose.Schema.Types.ObjectId }));
        const Department = mongoose.models.Department || mongoose.model('Department', new mongoose.Schema({ departmentName: String, businessUnitId: mongoose.Schema.Types.ObjectId, organizationId: mongoose.Schema.Types.ObjectId, status: String }));
        const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({ departmentId: mongoose.Schema.Types.ObjectId, name: String, status: String }));
        const EmployeeType = mongoose.models.EmployeeType || mongoose.model('EmployeeType', new mongoose.Schema({ organizationId: mongoose.Schema.Types.ObjectId, departmentId: mongoose.Schema.Types.ObjectId, employeeType: String }));

        // 1. Find Organization "Synture Tech"
        let org = await Organization.findOne({ name: "Synture Tech" });
        if (!org) {
            // Fallback to "Bizmate" if Synture Tech not found (though diag shows it exists)
            org = await Organization.findOne({ name: "Bizmate" });
        }

        if (!org) {
            console.error("Neither Synture Tech nor Bizmate found. Please create an organization first.");
            return;
        }
        console.log(`Using Organization: ${org.name} (${org._id})`);

        // 2. Business Unit: Technology (or refine "Developement")
        // The user's screenshot had "Developement" as BU and Dept.
        let bu = await BusinessUnit.findOne({ name: "Technology", organizationId: org._id });
        if (!bu) {
            bu = await BusinessUnit.findOneAndUpdate(
                { name: { $regex: /develop/i }, organizationId: org._id },
                { name: "Technology", organizationId: org._id },
                { upsert: true, new: true }
            );
            console.log("Updated/Created Business Unit: Technology");
        }

        // 3. Departments
        // Rename existing "Developement" or "Backend Development" departments to "Software Development"
        await Department.updateMany(
            { departmentName: { $regex: /develop/i }, organizationId: org._id },
            { departmentName: "Software Development", status: "Active" }
        );
        console.log("Updated 'Development' departments to 'Software Development'");

        let softDevDept = await Department.findOne({ departmentName: "Software Development", organizationId: org._id });
        if (!softDevDept) {
            softDevDept = await Department.create({
                departmentName: "Software Development",
                businessUnitId: bu._id,
                organizationId: org._id,
                status: "Active"
            });
            console.log("Created Department: Software Development");
        }

        // 4. Teams for Software Development
        const teams = ["React", "Node", "Next", "JS", "Python"];
        for (const teamName of teams) {
            await Team.findOneAndUpdate(
                { name: teamName, departmentId: softDevDept._id },
                { name: teamName, departmentId: softDevDept._id, status: "Active" },
                { upsert: true }
            );
        }
        console.log("Seeded Teams for Software Development");

        // 5. Employee Types for Software Development
        const types = ["Frontend", "Backend", "Fullstack", "DevOps"];
        for (const typeName of types) {
            await EmployeeType.findOneAndUpdate(
                { employeeType: typeName, organizationId: org._id, departmentId: softDevDept._id },
                { employeeType: typeName, organizationId: org._id, departmentId: softDevDept._id },
                { upsert: true }
            );
        }
        console.log("Seeded Employee Types for Software Development");

        // Remove redundant employee types like "Backend Developement" (from screenshot)
        const deleteResult = await EmployeeType.deleteMany({
            employeeType: { $regex: /Backend Develop/i },
            organizationId: org._id,
            departmentId: softDevDept._id
        });
        if (deleteResult.deletedCount > 0) {
            console.log(`Deleted ${deleteResult.deletedCount} redundant employee types`);
        }

        // 6. Other Departments
        const departmentsData = [
            {
                name: "Marketing",
                teams: ["Digital Marketing", "SEO", "Content", "Social Media"],
                types: ["Full Time", "Contract", "Intern"]
            },
            {
                name: "SRE",
                teams: ["Cloud Infrastructure", "Monitoring", "Reliability"],
                types: ["SRE Engineer", "Site Reliability Engineer"]
            },
            {
                name: "Quality Assurence",
                teams: ["Automation", "Manual", "Performance Testing"],
                types: ["QA Engineer", "SDET"]
            }
        ];

        for (const deptDef of departmentsData) {
            let dept = await Department.findOne({ departmentName: deptDef.name, organizationId: org._id });
            if (!dept) {
                dept = await Department.create({
                    departmentName: deptDef.name,
                    businessUnitId: bu._id,
                    organizationId: org._id,
                    status: "Active"
                });
                console.log(`Created Department: ${deptDef.name}`);
            } else {
                dept.status = "Active";
                await dept.save();
            }

            // Teams
            for (const teamName of deptDef.teams) {
                await Team.findOneAndUpdate(
                    { name: teamName, departmentId: dept._id },
                    { name: teamName, departmentId: dept._id, status: "Active" },
                    { upsert: true }
                );
            }
            console.log(`Seeded Teams for ${deptDef.name}`);

            // Types
            for (const typeName of deptDef.types) {
                await EmployeeType.findOneAndUpdate(
                    { employeeType: typeName, organizationId: org._id, departmentId: dept._id },
                    { employeeType: typeName, organizationId: org._id, departmentId: dept._id },
                    { upsert: true }
                );
            }
            console.log(`Seeded Employee Types for ${deptDef.name}`);
        }

        console.log("Seeding completed successfully!");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding data:", error);
    }
}

seed();
