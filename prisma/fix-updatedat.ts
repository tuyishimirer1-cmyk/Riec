import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.DATABASE_URL;

async function fixNullUpdatedAt() {
  if (!MONGODB_URI) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  const now = new Date();

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(); // Uses default database from connection string

    // Fix User collection
    const userResult = await db.collection('User').updateMany(
      { updatedAt: null },
      { $set: { updatedAt: now } }
    );
    console.log(`Fixed ${userResult.modifiedCount} users with null updatedAt`);

    // Fix Project collection
    const projectResult = await db.collection('Project').updateMany(
      { updatedAt: null },
      { $set: { updatedAt: now } }
    );
    console.log(`Fixed ${projectResult.modifiedCount} projects with null updatedAt`);

    // Fix Job collection
    const jobResult = await db.collection('Job').updateMany(
      { updatedAt: null },
      { $set: { updatedAt: now } }
    );
    console.log(`Fixed ${jobResult.modifiedCount} jobs with null updatedAt`);

    // Fix Purchase collection
    const purchaseResult = await db.collection('Purchase').updateMany(
      { updatedAt: null },
      { $set: { updatedAt: now } }
    );
    console.log(`Fixed ${purchaseResult.modifiedCount} purchases with null updatedAt`);

    // Fix ProjectAsset collection
    const projectAssetResult = await db.collection('ProjectAsset').updateMany(
      { updatedAt: null },
      { $set: { updatedAt: now } }
    );
    console.log(`Fixed ${projectAssetResult.modifiedCount} project assets with null updatedAt`);

    console.log('Data fix completed successfully');
  } catch (error) {
    console.error('Error fixing data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixNullUpdatedAt();
