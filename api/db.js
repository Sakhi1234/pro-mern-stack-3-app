const { MongoClient } = require('mongodb');

let db;

async function connectToDb() {
  const url = process.env.DB_URL || 'mongodb://localhost/issuetracker';
  const client = new MongoClient(url);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB at', url);
}

async function getNextSequence(name) {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { current: 1 } },
    { upsert: true, returnDocument: 'after' },
  );

  return result.current;
}

function getDb() {
  return db;
}

module.exports = { connectToDb, getNextSequence, getDb };
