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

    const teams = await db.collection('teams').find({}).toArray();
    console.log("=== MongoDB teams ===");
    console.log(teams);

    await mongoose.disconnect();
}

main();
