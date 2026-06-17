const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function seedHolidays() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in .env.local');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);

        const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', new mongoose.Schema({
            name: String,
            date: Date,
            type: String,
            description: String,
            organizationId: mongoose.Schema.Types.ObjectId,
            status: String
        }, { collection: 'holidays' }));

        const Organization = mongoose.models.Organization || mongoose.model('Organization', new mongoose.Schema({}, { collection: 'organizations' }));
        const org = await Organization.findOne();
        if (!org) throw new Error('No organization found to link holidays');

        const holidayData = [
            {
                name: 'New Year Day',
                date: new Date('2025-01-01'),
                type: 'Public',
                description: 'Global celebration of the new year.',
                organizationId: org._id,
                status: 'Active'
            },
            {
                name: 'Republic Day',
                date: new Date('2026-01-26'),
                type: 'Public',
                description: 'Honoring the date on which the Constitution of India came into effect.',
                organizationId: org._id,
                status: 'Active'
            },
            {
                name: 'Holi Festival',
                date: new Date('2025-03-14'),
                type: 'Public',
                description: 'Festival of colors and spring.',
                organizationId: org._id,
                status: 'Active'
            },
            {
                name: 'Independence Day',
                date: new Date('2025-08-15'),
                type: 'Public',
                description: 'Celebrating the nation independence.',
                organizationId: org._id,
                status: 'Active'
            },
            {
                name: 'Diwali',
                date: new Date('2025-10-20'),
                type: 'Public',
                description: 'Festival of lights.',
                organizationId: org._id,
                status: 'Active'
            },
            {
                name: 'Christmas',
                date: new Date('2025-12-25'),
                type: 'Public',
                description: 'Year-end festive holiday.',
                organizationId: org._id,
                status: 'Active'
            }
        ];

        console.log('Clearing existing holidays...');
        await Holiday.deleteMany({ organizationId: org._id });

        console.log('Inserting sample holidays...');
        await Holiday.insertMany(holidayData);

        console.log('✅ Holidays seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding holidays:', error);
        process.exit(1);
    }
}

seedHolidays();
