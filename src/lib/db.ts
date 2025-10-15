const DB_URL = 'https://satdevoluciones.com/db.json';

// This function reads the remote db.json file
export const readDB = async () => {
  try {
    const response = await fetch(DB_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch db.json: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error reading from remote db.json:", error);
    // Return a default structure if reading fails to avoid crashing the app
    return { users: [], balances: {}, investments: [], transactions: [], properties: [], withdrawalRequests: [] };
  }
};

// This function writes the entire database object back to the remote URL.
export const writeDB = async (data: any) => {
    try {
        const response = await fetch(DB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data, null, 2), // Pretty-print JSON
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to write to db.json: ${response.statusText}. Body: ${errorBody}`);
        }
        // It's good practice to check if the response is JSON before parsing.
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            return { success: true, message: "Database updated successfully, no JSON response." };
        }
    } catch (error) {
        console.error("Error writing to remote db.json:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};
