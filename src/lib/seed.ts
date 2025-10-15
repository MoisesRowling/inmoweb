'use server';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { propertiesData } from './data';

// IMPORTANT: This seeding script is for development purposes.
// It will overwrite existing data in the 'properties' collection.
// Ensure your Firebase Admin SDK configuration is set up.

// Check if the app is already initialized to prevent errors
try {
  initializeApp({
    // projectId is automatically inferred from GCLOUD_PROJECT environment variable
  });
} catch (e: any) {
  if (e.code !== 'app/duplicate-app') {
    console.error('Firebase Admin initialization error:', e);
  }
}

const db = getFirestore();

export async function seedProperties() {
  const propertiesCollection = db.collection('properties');
  console.log('Seeding properties...');

  try {
    // Firestore batch writes are limited to 500 operations.
    // If you have more properties, you'll need to split this into multiple batches.
    if (propertiesData.length > 500) {
      throw new Error('Too many properties to seed in a single batch.');
    }

    const batch = db.batch();

    for (const property of propertiesData) {
      // Use the existing property ID for the document ID
      const docRef = propertiesCollection.doc(property.id);
      batch.set(docRef, property);
    }

    await batch.commit();
    console.log(`Successfully seeded ${propertiesData.length} properties.`);
    return { success: true, message: `Seeded ${propertiesData.length} properties.` };
  } catch (error) {
    console.error('Error seeding properties:', error);
    return { success: false, message: 'Error seeding properties.' };
  }
}

// Example of how to call this from another server-side file or a dedicated API route.
// (async () => {
//   await seedProperties();
// })();
