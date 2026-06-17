const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const BusinessUnitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({
    departmentName: { type: String, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const EmployeeTypeSchema = new mongoose.Schema({
    employeeType: { type: String, required: true, trim: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
const BusinessUnit = mongoose.models.BusinessUnit || mongoose.model('BusinessUnit', BusinessUnitSchema);
const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const EmployeeType = mongoose.models.EmployeeType || mongoose.model('EmployeeType', EmployeeTypeSchema);

const MONGODB_URI = "mongodb+srv://gaikwadsameer422_db_user:vYkPEmN1wMSaEKd9@cluster0.fqf0bni.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGODB_URI);

        let org = await Organization.findOne();
        if (!org) {
            console.log("No organization found. Creating 'Synture Tech'...");
            org = await Organization.create({ name: 'Synture Tech', description: 'Restored Organization' });
        } else {
            console.log(`Using existing organization: ${org.name}`);
        }

        // Create Business Units
        console.log("Creating Business Units...");
        const buTech = await BusinessUnit.findOneAndUpdate(
            { name: "Tech", organizationId: org._id },
            { name: "Tech", organizationId: org._id },
            { upsert: true, new: true }
        );
        const buMarketing = await BusinessUnit.findOneAndUpdate(
            { name: "Marketing", organizationId: org._id },
            { name: "Marketing", organizationId: org._id },
            { upsert: true, new: true }
        );

        // Create Departments
        console.log("Creating Departments...");
        const devDept = await Department.findOneAndUpdate(
            { departmentName: "Software Development", organizationId: org._id },
            { departmentName: "Software Development", organizationId: org._id, businessUnitId: buTech._id },
            { upsert: true, new: true }
        );
        const qaDept = await Department.findOneAndUpdate(
            { departmentName: "QA", organizationId: org._id },
            { departmentName: "QA", organizationId: org._id, businessUnitId: buTech._id },
            { upsert: true, new: true }
        );
        const devOpsDept = await Department.findOneAndUpdate(
            { departmentName: "DevOps", organizationId: org._id },
            { departmentName: "DevOps", organizationId: org._id, businessUnitId: buTech._id },
            { upsert: true, new: true }
        );
        const marketingDept = await Department.findOneAndUpdate(
            { departmentName: "Marketing", organizationId: org._id },
            { departmentName: "Marketing", organizationId: org._id, businessUnitId: buMarketing._id },
            { upsert: true, new: true }
        );

        // Create Teams
        console.log("Creating Teams...");
        // Software Development Teams
        for (const t of ["JS", "React", "Node.js", "Next.js"]) {
            await Team.findOneAndUpdate(
                { name: t, departmentId: devDept._id },
                { name: t, departmentId: devDept._id },
                { upsert: true }
            );
        }
        // Marketing Teams
        for (const t of ["SEO", "Digital Marketing", "Content Creator"]) {
            await Team.findOneAndUpdate(
                { name: t, departmentId: marketingDept._id },
                { name: t, departmentId: marketingDept._id },
                { upsert: true }
            );
        }

        // Create Employee Types
        console.log("Creating Employee Types...");
        // Software Dev types
        await EmployeeType.findOneAndUpdate({ employeeType: "Frontend Dev" }, { employeeType: "Frontend Dev", organizationId: org._id, departmentId: devDept._id }, { upsert: true });
        await EmployeeType.findOneAndUpdate({ employeeType: "Backend Dev" }, { employeeType: "Backend Dev", organizationId: org._id, departmentId: devDept._id }, { upsert: true });

        // QA types
        await EmployeeType.findOneAndUpdate({ employeeType: "QA" }, { employeeType: "QA", organizationId: org._id, departmentId: qaDept._id }, { upsert: true });

        // DevOps types
        await EmployeeType.findOneAndUpdate({ employeeType: "DevOps" }, { employeeType: "DevOps", organizationId: org._id, departmentId: devOpsDept._id }, { upsert: true });

        // Marketing types
        await EmployeeType.findOneAndUpdate({ employeeType: "Marketing" }, { employeeType: "Marketing", organizationId: org._id, departmentId: marketingDept._id }, { upsert: true });

        console.log("Successfully seeded data!");
    } catch (error) {
        console.error("Error seeding custom data:", error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
