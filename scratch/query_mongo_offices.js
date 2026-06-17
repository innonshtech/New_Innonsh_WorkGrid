const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function main() {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
        console.error("No MongoDB URI");
        return;
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    const offices = await db.collection('officelocations').find({}).toArray();
    console.log("=== MongoDB officelocations ===");
    console.log(JSON.stringify(offices, null, 2));

    await mongoose.disconnect();
}

main();
