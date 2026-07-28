require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const SEED_COURSES = [
  { courseType: "10-Day", startDate: "2026-05-03", endDate: "2026-05-13", status: "Attended", fullTime: true, location: "Dhamma Mālwā", teacher: "Mrs. Nisha Roy", number: "" },
  { courseType: "10-Day", startDate: "2024-07-07", endDate: "2024-07-18", status: "Served", fullTime: true, location: "Dhamma Mālwā", teacher: "P.S. Saakhre", number: "" },
  { courseType: "3-Day", startDate: "2023-10-14", endDate: "2023-10-17", status: "Attended", fullTime: true, location: "Dhamma Mālwā", teacher: "unknown", number: "" },
  { courseType: "10-Day", startDate: "2023-03-12", endDate: "2023-03-23", status: "Attended", fullTime: true, location: "Dhamma Rata", teacher: "prakashchandra jhunjhunwala", number: "" },
];

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI. Make sure .env.local exists and is filled in.");
    process.exit(1);
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "vipassana_tracker");

  const existing = await db.collection("courses").countDocuments();
  if (existing === 0) {
    await db.collection("courses").insertMany(SEED_COURSES);
    console.log(`Seeded ${SEED_COURSES.length} courses into "${db.databaseName}".`);
  } else {
    console.log(`courses collection already has ${existing} document(s) — skipped seeding to avoid duplicates.`);
  }

  await client.close();
})();
