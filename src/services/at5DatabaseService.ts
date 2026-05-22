import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  getDoc,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { AT5CatalogItem } from '../types';
import { VerifiedMapping } from './at5VerifiedProtocols';

// Enum for Operation Types (Mandatory for error logging)
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Removes 'undefined' values from an object while preserving Firestore FieldValue sentinels.
 * Firestore will reject 'undefined' but ignores missing keys.
 */
function sanitize(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  // If it's a Firestore FieldValue (e.g. serverTimestamp), don't recurse into it.
  // FieldValue objects in the browser SDK often have a custom constructor like FieldValueImpl 
  // or they just don't have 'Object' as their constructor.
  if (data.constructor && data.constructor.name !== 'Object' && data.constructor.name !== 'Array') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = sanitize(value);
    }
  }
  return result;
}

export const at5DatabaseService = {
  /**
   * Main Catalogue
   */
  async getCatalogue(): Promise<AT5CatalogItem[]> {
    const path = 'catalogue';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => doc.data() as AT5CatalogItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveGearItem(gear: AT5CatalogItem) {
    if (!auth.currentUser) throw new Error("Must be signed in to save gear");
    if (!gear.guid || gear.guid.length < 5) throw new Error(`Invalid GUID: ${gear.guid}`);
    
    const path = `catalogue/${gear.guid}`;
    try {
      const data = sanitize({
        ...gear,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
      await setDoc(doc(db, 'catalogue', gear.guid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Verified Mappings
   */
  async getVerifiedMappings(type: 'cabs' | 'speakers' | 'mics'): Promise<VerifiedMapping[]> {
    const path = `verified_${type}`;
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => doc.data() as VerifiedMapping);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveVerifiedMapping(type: 'cabs' | 'speakers' | 'mics', mapping: VerifiedMapping) {
    if (!auth.currentUser) throw new Error("Must be signed in to verify protocols");
    if (!mapping.guid || mapping.guid.length < 5) throw new Error(`Invalid GUID: ${mapping.guid}`);

    const path = `verified_${type}/${mapping.guid}`;
    try {
      const data = sanitize({
        ...mapping,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
      await setDoc(doc(db, `verified_${type}`, mapping.guid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGearItem(guid: string) {
    if (!auth.currentUser) throw new Error("Must be signed in to delete gear");
    const path = `catalogue/${guid}`;
    try {
      await deleteDoc(doc(db, 'catalogue', guid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteVerifiedMapping(type: 'cabs' | 'speakers' | 'mics', guid: string) {
    if (!auth.currentUser) throw new Error("Must be signed in to delete mappings");
    const path = `verified_${type}/${guid}`;
    try {
      await deleteDoc(doc(db, `verified_${type}`, guid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Seeding utility (Uses Batches for efficiency)
   */
  async seedDatabase(staticCatalog: AT5CatalogItem[], staticMappings: { cabs: VerifiedMapping[], speakers: VerifiedMapping[], mics: VerifiedMapping[] }) {
    if (!auth.currentUser) throw new Error("Must be signed in to seed");
    
    console.log("Seeding began (Using Batches)...");
    const batchSize = 400; // Firestore limit is 500
    
    const seedCollection = async (items: any[], type: 'gear' | 'mapping', mappingType?: 'cabs' | 'speakers' | 'mics') => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + batchSize);
        
        chunk.forEach(item => {
          const docRef = type === 'gear' 
            ? doc(db, 'catalogue', item.guid)
            : doc(db, `verified_${mappingType}`, item.guid);
            
          batch.set(docRef, sanitize({
            ...item,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser!.uid
          }));
        });
        
        await batch.commit();
        console.log(`Committed batch ${i / batchSize + 1}`);
      }
    };

    try {
      await seedCollection(staticCatalog, 'gear');
      await seedCollection(staticMappings.cabs, 'mapping', 'cabs');
      await seedCollection(staticMappings.speakers, 'mapping', 'speakers');
      await seedCollection(staticMappings.mics, 'mapping', 'mics');
      console.log("Seeding complete!");
    } catch (error) {
       console.error("Batch seed failed:", error);
       handleFirestoreError(error, OperationType.WRITE, "BATCH_SEED");
    }
  }
};

