import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' && 
  firebaseConfig.apiKey !== ''

let db = null

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  } catch (err) {
    console.error('Firebase initialization failed:', err)
  }
} else {
  console.warn('Firebase credentials not configured yet. Using localStorage fallback.')
}

export { db }

export function isFirebaseEnabled() {
  return !!db
}

// Fetch categories: document `category/categories`
export async function fetchCategories() {
  if (!db) return null
  try {
    const docRef = doc(db, 'category', 'categories')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().list
    }
  } catch (err) {
    console.error('Error fetching categories from Firestore:', err)
  }
  return null
}

// Save categories: document `category/categories`
export async function saveCategories(categories) {
  if (!db) return
  try {
    const docRef = doc(db, 'category', 'categories')
    await setDoc(docRef, { list: categories })
  } catch (err) {
    console.error('Error saving categories to Firestore:', err)
  }
}

// Fetch all matrix documents in the collection `cashout`
export async function fetchMatrix() {
  if (!db) return null
  try {
    const querySnapshot = await getDocs(collection(db, 'cashout'))
    const matrix = {}
    querySnapshot.forEach((doc) => {
      matrix[doc.id] = doc.data()
    })
    return matrix
  } catch (err) {
    console.error('Error fetching matrix from Firestore:', err)
    return null
  }
}

// Save matrix document for a specific date: document `cashout/{dateKey}`
export async function saveMatrixDoc(dateKey, data) {
  if (!db) return
  try {
    const docRef = doc(db, 'cashout', dateKey)
    await setDoc(docRef, data)
  } catch (err) {
    console.error(`Error saving matrix document for ${dateKey} to Firestore:`, err)
  }
}

// Fetch all daily documents in the collection `daily`
export async function fetchDaily() {
  if (!db) return null
  try {
    const querySnapshot = await getDocs(collection(db, 'daily'))
    const daily = {}
    querySnapshot.forEach((doc) => {
      daily[doc.id] = doc.data()
    })
    return daily
  } catch (err) {
    console.error('Error fetching daily from Firestore:', err)
    return null
  }
}

// Save daily document for a specific date: document `daily/{dateKey}`
export async function saveDailyDoc(dateKey, data) {
  if (!db) return
  try {
    const docRef = doc(db, 'daily', dateKey)
    await setDoc(docRef, data)
  } catch (err) {
    console.error(`Error saving daily document for ${dateKey} to Firestore:`, err)
  }
}
