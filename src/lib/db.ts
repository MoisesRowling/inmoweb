'use server';
import fs from 'fs/promises';
import path from 'path';

// This is a local-only database solution. It reads and writes to a db.json
// file in the root of the project. This is simple and reliable for local
// development and prototyping.

// Get the path to the db.json file
const dbPath = path.join(process.cwd(), 'db.json');

// This function reads the local db.json file
export const readDB = async () => {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If the file doesn't exist, return a default structure
      console.log("db.json not found, returning default structure.");
      return { users: [], balances: {}, properties: [], investments: [], transactions: [], withdrawalRequests: [] };
    }
    console.error("Error reading from local db.json:", error);
    throw error;
  }
};

// This function writes the entire database object back to the local db.json file.
export const writeDB = async (data: any) => {
  try {
    const fileContent = JSON.stringify(data, null, 2);
    await fs.writeFile(dbPath, fileContent, 'utf-8');
    return { success: true, message: "Database updated successfully." };
  } catch (error) {
    console.error("Error writing to local db.json:", error);
    throw error;
  }
};
