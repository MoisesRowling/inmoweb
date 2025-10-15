'use server';

const BIN_ID = process.env.JSONBIN_BIN_ID;
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const ACCESS_KEY = process.env.JSONBIN_ACCESS_KEY;
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// This function reads the remote db.json from jsonbin.io
export const readDB = async () => {
  if (!BIN_ID || !MASTER_KEY) {
    throw new Error("JSONBin.io read credentials are not set in environment variables.");
  }
  
  try {
    const response = await fetch(`${API_URL}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': MASTER_KEY.trim(),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to read from JSONBin.io: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error("Error reading from jsonbin.io:", error);
    throw error;
  }
};

// This function writes the entire database object back to jsonbin.io.
export const writeDB = async (data: any) => {
    if (!BIN_ID || !ACCESS_KEY) {
        throw new Error("JSONBin.io write credentials (Access Key) are not set in environment variables.");
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': ACCESS_KEY.trim(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to write to JSONBin.io: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        return { success: true, message: "Database updated successfully.", data: result.record };
    } catch (error) {
        console.error("Error writing to jsonbin.io:", error);
        throw error;
    }
};
