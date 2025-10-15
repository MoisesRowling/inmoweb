'use server';

import fs from 'fs/promises';
import path from 'path';

// Get the path to the db.json file
const dbPath = path.join(process.cwd(), 'db.json');

// This function reads the local db.json file
export const readDB = async () => {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    // If the file doesn't exist, return a default structure
    if (error.code === 'ENOENT') {
      console.log('db.json not found, returning default structure.');
      return { users: [], balances: {}, investments: [], transactions: [], properties: [], withdrawalRequests: [] };
    }
    console.error("Error reading from local db.json:", error);
    throw error;
  }
};

// This function writes the entire database object back to the local db.json file.
export const writeDB = async (data: any) => {
    try {
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true, message: "Database updated successfully." };
    } catch (error) {
        console.error("Error writing to local db.json:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};
