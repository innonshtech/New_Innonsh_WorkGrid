const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Models (Using commonjs for script)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "employee", "supervisor"], default: "employee" },
    employeeId: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

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

const CostCenterSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    personalDetails: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true }
    },
    jobDetails: {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
        departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        costCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
        designation: String
    },
    // NEW FIELD: Password for login
    password: { type: String },
    // NEW FIELD: Role
    role: { type: String, enum: ["employee", "attendance_only", "admin", "supervisor"], default: "employee" },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
const BusinessUnit = mongoose.models.BusinessUnit || mongoose.model('BusinessUnit', BusinessUnitSchema);
const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const CostCenter = mongoose.models.CostCenter || mongoose.model('CostCenter', CostCenterSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

const MONGODB_URI = "mongodb+srv://gaikwadsameer422_db_user:vYkPEmN1wMSaEKd9@cluster0.fqf0bni.mongodb.net/?appName=Cluster0";

async function seed() {
    try {
        console.log("🚀 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected!");

        // Clear existing data (Careful!)
        console.log("🧹 Cleaning old data...");
        await Promise.all([
            User.deleteMany({}),
            Organization.deleteMany({}),
            BusinessUnit.deleteMany({}),
            Department.deleteMany({}),
            Team.deleteMany({}),
            CostCenter.deleteMany({}),
            Employee.deleteMany({})
        ]);

        const saltRounds = 10;
        const adminPassword = await bcrypt.hash('admin123', saltRounds);
        const empPassword = await bcrypt.hash('emp123', saltRounds);

        // 1. Create Admin User
        console.log("👤 Creating Admin...");
        const admin = await User.create({
            name: "System Admin",
            email: "admin@softtech.com",
            password: adminPassword,
            role: "admin",
            employeeId: "ADM001"
        });

        // 2. Organizations
        console.log("🏢 Creating Organizations...");
        const org1 = await Organization.create({ name: "TechCorp Global", description: "Global Enterprise Software" });
        const org2 = await Organization.create({ name: "InnovateSoft Solutions", description: "AI & Cloud Specialists" });

        // 3. Business Units for Org 1
        console.log("💼 Creating Business Units...");
        const bu1 = await BusinessUnit.create({ name: "Product Engineering", organizationId: org1._id });
        const bu2 = await BusinessUnit.create({ name: "Digital Transformation", organizationId: org1._id });
        const bu3 = await BusinessUnit.create({ name: "Cloud & DevOps", organizationId: org2._id });

        // 4. Departments
        console.log("📁 Creating Departments...");
        const dept1 = await Department.create({ departmentName: "Frontend Development", organizationId: org1._id, businessUnitId: bu1._id });
        const dept2 = await Department.create({ departmentName: "Backend Development", organizationId: org1._id, businessUnitId: bu1._id });
        const dept3 = await Department.create({ departmentName: "Quality Assurance", organizationId: org1._id, businessUnitId: bu2._id });
        const dept4 = await Department.create({ departmentName: "Site Reliability", organizationId: org2._id, businessUnitId: bu3._id });

        // 5. Teams
        console.log("👥 Creating Teams...");
        const team1 = await Team.create({ name: "React Squad", departmentId: dept1._id });
        const team2 = await Team.create({ name: "NextJS Core", departmentId: dept1._id });
        const team3 = await Team.create({ name: "NodeJS Backend", departmentId: dept2._id });
        const team4 = await Team.create({ name: "Cloud Ops", departmentId: dept4._id });

        // 6. Cost Centers
        console.log("💰 Creating Cost Centers...");
        const cc1 = await CostCenter.create({ name: "R&D Software", code: "CC-RD-001" });
        const cc2 = await CostCenter.create({ name: "Operations", code: "CC-OPS-001" });

        // 7. Employees
        console.log("👨‍💼 Creating Employees...");
        const employees = [
            {
                id: "EMP101",
                first: "John",
                last: "Doe",
                email: "john@softtech.com",
                org: org1._id,
                bu: bu1._id,
                dept: dept1._id,
                team: team1._id,
                cc: cc1._id,
                role: "manager",
                designation: "Frontend Manager"
            },
            {
                id: "EMP102",
                first: "Jane",
                last: "Smith",
                email: "jane@softtech.com",
                org: org1._id,
                bu: bu1._id,
                dept: dept1._id,
                team: team1._id,
                cc: cc1._id,
                role: "employee",
                designation: "Senior React Developer"
            },
            {
                id: "EMP103",
                first: "Alice",
                last: "Johnson",
                email: "alice@softtech.com",
                org: org2._id,
                bu: bu3._id,
                dept: dept4._id,
                team: team4._id,
                cc: cc2._id,
                role: "supervisor",
                designation: "SRE Lead"
            }
        ];

        for (const empData of employees) {
            // Create User Record
            await User.create({
                name: `${empData.first} ${empData.last}`,
                email: empData.email,
                password: empPassword,
                role: empData.role,
                employeeId: empData.id
            });

            // Create Employee Record
            await Employee.create({
                employeeId: empData.id,
                personalDetails: {
                    firstName: empData.first,
                    lastName: empData.last,
                    email: empData.email
                },
                jobDetails: {
                    organizationId: empData.org,
                    businessUnitId: empData.bu,
                    departmentId: empData.dept,
                    teamId: empData.team,
                    costCenterId: empData.cc,
                    designation: empData.designation
                },
                password: empPassword,
                role: empData.role
            });
        }

        console.log("✨ Seeding Completed Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
}

seed();
