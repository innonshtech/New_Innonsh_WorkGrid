const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function check() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("No MONGODB_URI in environment variables.");
    return;
  }
  
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB!");
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  const skillsColl = collections.find(c => c.name.toLowerCase().includes('skill'));
  if (skillsColl) {
    const records = await db.collection(skillsColl.name).find({}).toArray();
    console.log(`\n=== MONGO ${skillsColl.name.toUpperCase()} SAMPLES ===`);
    console.log(records.slice(0, 5));
  } else {
    console.log("No skills collection found in MongoDB.");
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
