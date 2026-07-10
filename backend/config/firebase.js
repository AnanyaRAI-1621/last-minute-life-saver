import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let db;
let auth;
let isMockMode = false;

// In-memory mock database for fallback local development when Firebase is not configured
class MockFirestore {
  constructor() {
    this.data = {
      users: {},
      tasks: {},
      schedules: {},
      analytics: {}
    };
  }

  collection(name) {
    if (!this.data[name]) {
      this.data[name] = {};
    }
    const colName = name;
    const self = this;

    return {
      doc(id) {
        const docId = id || Math.random().toString(36).substring(2, 15);
        if (!self.data[colName][docId]) {
          self.data[colName][docId] = { id: docId };
        }
        return {
          get: async () => {
            const data = self.data[colName][docId];
            return {
              exists: !!data && Object.keys(data).length > 1, // check if contains more than just 'id'
              data: () => data,
              id: docId
            };
          },
          set: async (newData, options) => {
            if (options && options.merge) {
              self.data[colName][docId] = { ...self.data[colName][docId], ...newData };
            } else {
              self.data[colName][docId] = { id: docId, ...newData };
            }
            return { writeTime: new Date() };
          },
          update: async (newData) => {
            self.data[colName][docId] = { ...self.data[colName][docId], ...newData };
            return { writeTime: new Date() };
          },
          delete: async () => {
            delete self.data[colName][docId];
            return { writeTime: new Date() };
          }
        };
      },
      where(field, operator, value) {
        // Return a basic mock query builder
        return {
          get: async () => {
            const docs = Object.values(self.data[colName]).filter(doc => {
              if (operator === '==') return doc[field] === value;
              if (operator === '>=') return doc[field] >= value;
              if (operator === '<=') return doc[field] <= value;
              if (operator === 'array-contains') return Array.isArray(doc[field]) && doc[field].includes(value);
              return false;
            });
            return {
              empty: docs.length === 0,
              docs: docs.map(doc => ({
                id: doc.id,
                data: () => doc,
                ref: {
                  delete: async () => {
                    delete self.data[colName][doc.id];
                    return { writeTime: new Date() };
                  },
                  update: async (newData) => {
                    self.data[colName][doc.id] = { ...self.data[colName][doc.id], ...newData };
                    return { writeTime: new Date() };
                  },
                  set: async (newData, options) => {
                    if (options && options.merge) {
                      self.data[colName][doc.id] = { ...self.data[colName][doc.id], ...newData };
                    } else {
                      self.data[colName][doc.id] = { id: doc.id, ...newData };
                    }
                    return { writeTime: new Date() };
                  }
                }
              }))
            };
          },
          where(f2, op2, v2) {
            return this; // mock chaining
          }
        };
      },
      get: async () => {
        const docs = Object.values(self.data[colName]);
        return {
          empty: docs.length === 0,
          docs: docs.map(doc => ({
            id: doc.id,
            data: () => doc,
            ref: {
              delete: async () => {
                delete self.data[colName][doc.id];
                return { writeTime: new Date() };
              },
              update: async (newData) => {
                self.data[colName][doc.id] = { ...self.data[colName][doc.id], ...newData };
                return { writeTime: new Date() };
              },
              set: async (newData, options) => {
                if (options && options.merge) {
                  self.data[colName][doc.id] = { ...self.data[colName][doc.id], ...newData };
                } else {
                  self.data[colName][doc.id] = { id: doc.id, ...newData };
                }
                return { writeTime: new Date() };
              }
            }
          }))
        };
      }
    };
  }
}

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const rawData = fs.readFileSync(serviceAccountPath);
    const serviceAccount = JSON.parse(rawData);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('Firebase Admin SDK initialized via Service Account JSON file.');
  } else if (projectId && clientEmail && privateKey) {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      })
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('Firebase Admin SDK initialized via environment variables.');
  } else {
    throw new Error('No Firebase configuration variables found.');
  }
} catch (error) {
  console.warn('WARNING: Firebase credentials not found or failed to initialize. Error:', error.message);
  if (process.env.DEV_MODE_BYPASS === 'true' || process.env.NODE_ENV === 'development') {
    console.warn('DEV_MODE_BYPASS is active. Running with Mock In-Memory Database and Mock Auth.');
    isMockMode = true;
    db = new MockFirestore();
    auth = {
      verifyIdToken: async (token) => {
        if (token === 'mock-token' || token.startsWith('mock-uid-')) {
          const uid = token === 'mock-token' ? 'mock-user-123' : token.replace('mock-uid-', '');
          return { uid, email: 'mockuser@example.com', name: 'Mock User' };
        }
        throw new Error('Invalid token in mock mode');
      },
      createUser: async (userRecord) => {
        return { uid: userRecord.uid || 'mock-user-123', email: userRecord.email, displayName: userRecord.displayName };
      }
    };
  } else {
    console.error('CRITICAL: Firebase Admin failed to initialize and bypass is not active.');
    process.exit(1);
  }
}

export { db, auth, isMockMode };
