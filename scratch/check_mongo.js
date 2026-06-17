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

    const ets = await db.collection('employeetypes').find({}).toArray();
    console.log("=== MongoDB employeetypes ===");
    console.log(ets);

    const ecs = await db.collection('employeecategories').find({}).toArray();
    console.log("=== MongoDB employeecategories ===");
    console.log(ecs);

    const escs = await db.collection('employeesubcategories').find({}).toArray();
    console.log("=== MongoDB employeesubcategories ===");
    console.log(escs);

    await mongoose.disconnect();
}

main();
