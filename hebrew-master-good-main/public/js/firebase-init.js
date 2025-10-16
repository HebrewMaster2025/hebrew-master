const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZtiVXvMKX3FodLchIQzIUUqg15htdwyA",
  authDomain: "ai-hebrew.firebaseapp.com",
  projectId: "ai-hebrew",
  storageBucket: "ai-hebrew.firebasestorage.app",
  messagingSenderId: "63571235516",
  appId: "1:63571235516:web:6b81c388fca7d4fc39f6b9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
  console.log('✅ Firebase initialized');
} else {
  console.log('ℹ️ Firebase already initialized');
}

const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics ? firebase.analytics() : null;

async function requireAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('⚠️ User not authenticated, redirecting to login');
        window.location.href = '/login';
        resolve(null);
      } else {
        console.log('✅ User authenticated:', user.email);
        resolve(user);
      }
    });
  });
}

function getCurrentUser() {
  return auth.currentUser;
}

function isAuthenticated() {
  return auth.currentUser !== null;
}

async function signOut() {
  try {
    await auth.signOut();
    console.log('✅ Sign-out successful');
    sessionStorage.clear();
    window.location.href = '/';
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    throw error;
  }
}

async function signInWithGoogle() {
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    console.log('✅ Google sign-in successful:', user.email);
    await saveUserProfile(user);
    
    return user;
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    throw error;
  }
}

async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;
    
    if (displayName) {
      await user.updateProfile({ displayName });
    }
    
    console.log('✅ Email sign-up successful:', user.email);
    await saveUserProfile(user);
    
    return user;
  } catch (error) {
    console.error('❌ Email sign-up error:', error);
    throw error;
  }
}

async function loginWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const user = result.user;
    
    console.log('✅ Email login successful:', user.email);
    
    return user;
  } catch (error) {
    console.error('❌ Email login error:', error);
    throw error;
  }
}

async function saveUserProfile(user) {
  try {
    const userRef = db.collection('users').doc(user.uid);
    
    await userRef.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || null,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ User profile saved to Firestore');
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
  }
}

async function getUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      return userDoc.data();
    } else {
      console.log('⚠️ User document does not exist');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
}

async function updateUserProgress(userId, lessonId, completed = true) {
  try {
    const progressRef = db.collection('users').doc(userId).collection('progress').doc(lessonId);
    
    await progressRef.set({
      completed,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ Progress updated for lesson:', lessonId);
  } catch (error) {
    console.error('❌ Error updating progress:', error);
  }
}

async function getUserProgress(userId) {
  try {
    const progressSnapshot = await db.collection('users').doc(userId).collection('progress').get();
    
    const progress = {};
    progressSnapshot.forEach((doc) => {
      progress[doc.id] = doc.data();
    });
    
    return progress;
  } catch (error) {
    console.error('❌ Error getting user progress:', error);
    return {};
  }
}

window.FirebaseApp = {
  auth,
  db,
  analytics,
  requireAuth,
  getCurrentUser,
  isAuthenticated,
  signOut,
  signInWithGoogle,
  signUpWithEmail,
  loginWithEmail,
  saveUserProfile,
  getUserData,
  updateUserProgress,
  getUserProgress,
};

console.log('🔥 Firebase helper functions loaded');
