import { pool } from "./config/db.js";

const testDB = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("DB CONNECTED:", result.rows);
  } catch (err) {
    console.error("DB ERROR:", err);
  }
};

testDB();