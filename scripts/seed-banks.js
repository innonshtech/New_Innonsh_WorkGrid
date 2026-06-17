const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in .env file");
    process.exit(1);
}

const BankSchema = new mongoose.Schema({
    name: { type: String, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    description: String,
    status: { type: String, enum: ["Active", "Inactive"], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const Bank = mongoose.models.Bank || mongoose.model('Bank', BankSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

async function seed() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected!");

        const org = await Organization.findOne();
        if (!org) {
            console.error("No organization found. Please run seed.js or create an organization first.");
            process.exit(1);
        }
        console.log(`Using Organization: ${org.name} (${org._id})`);

        const banksToSeed = [
            "Bank of Maharashtra",
            "HDFC Bank",
            "State Bank of India",
            "ICICI Bank",
            "Axis Bank",
            "Punjab National Bank",
            "Kotak Mahindra Bank"
        ];

        for (const name of banksToSeed) {
            const existing = await Bank.findOne({ name, organizationId: org._id });
            if (!existing) {
                await Bank.create({
                    name,
                    organizationId: org._id,
                    description: `${name} Seeded Default Bank`,
                    status: 'Active'
                });
                console.log(`Seeded bank: ${name}`);
            } else {
                console.log(`Bank already exists: ${name}`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding:", e);
        process.exit(1);
    }
}

seed();
