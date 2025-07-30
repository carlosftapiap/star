
import { db } from './config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    Timestamp,
    setDoc,
} from 'firebase/firestore';
import type { UserDetails, Product, Reward } from '@/app/dashboard/page';
import { sendWebhook } from '../webhook';

interface RedemptionRecord {
    userId: string;
    userName: string;
    rewardId: string;
    rewardName: string;
    pointsRedeemed: number;
    timestamp: Date;
}


// --- User Functions ---

export async function findUserByEmail(email: string): Promise<(UserDetails & { id: string }) | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as UserDetails;

    // Convert Firestore Timestamps to JS Date objects
    if (userData.birthday && userData.birthday instanceof Timestamp) {
        userData.birthday = userData.birthday.toDate();
    }
    
    return { id: userDoc.id, ...userData };
}

export async function getUserById(userId: string): Promise<(UserDetails & { id: string }) | null> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        return null;
    }
    const userData = userDoc.data() as UserDetails;

    // Convert Firestore Timestamps to JS Date objects
    if (userData.birthday && userData.birthday instanceof Timestamp) {
        userData.birthday = userData.birthday.toDate();
    }

    return { id: userDoc.id, ...userData };
}

export async function getUsers(): Promise<(UserDetails & { id: string })[]> {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = querySnapshot.docs
        .map(doc => {
            const data = doc.data() as UserDetails;
            if (data.birthday && data.birthday instanceof Timestamp) {
                data.birthday = data.birthday.toDate();
            }
            return { id: doc.id, ...data };
        })
        .filter(user => !user.isAdmin); // Filter out admins client-side
        
    return users;
}


export async function createUser(userData: Omit<UserDetails, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, "users"), userData);
  // Send webhook notification
  await sendWebhook('user.created', { id: docRef.id, ...userData });
  return docRef.id;
}

export async function updateUser(userId: string, userData: Partial<UserDetails>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    // Send webhook notification
    await sendWebhook('user.updated', { id: userId, ...userData });
}

// --- Product Functions ---

export async function getProducts(): Promise<(Product & { docId: string })[]> {
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    return querySnapshot.docs.map(doc => ({ docId: doc.id, ...(doc.data() as Product) }));
}

export async function addProduct(productData: Omit<Product, 'docId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
}

export async function deleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
}

// --- Reward Functions ---

export async function getRewards(): Promise<(Reward & { docId: string })[]> {
    const rewardsRef = collection(db, 'rewards');
    const querySnapshot = await getDocs(rewardsRef);
    return querySnapshot.docs.map(doc => ({ docId: doc.id, ...(doc.data() as Reward) }));
}

export async function addReward(rewardData: Omit<Reward, 'docId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'rewards'), rewardData);
    return docRef.id;
}

export async function deleteReward(rewardId: string): Promise<void> {
    const rewardRef = doc(db, 'rewards', rewardId);
    await deleteDoc(rewardRef);
}

// --- Redemption Functions ---
export async function recordRedemption(redemptionData: RedemptionRecord): Promise<string> {
    const docRef = await addDoc(collection(db, 'redemptions'), redemptionData);
     // Send webhook notification
    await sendWebhook('redemption.created', { id: docRef.id, ...redemptionData });
    return docRef.id;
}

// --- Webhook Settings ---

const settingsDocRef = doc(db, 'settings', 'webhook');

export async function saveWebhookUrl(url: string): Promise<void> {
  await setDoc(settingsDocRef, { url });
}

export async function getWebhookUrl(): Promise<string | null> {
  const docSnap = await getDoc(settingsDocRef);
  if (docSnap.exists()) {
    return docSnap.data().url || null;
  }
  return null;
}

export async function deleteWebhookUrl(): Promise<void> {
    await deleteDoc(settingsDocRef);
}
