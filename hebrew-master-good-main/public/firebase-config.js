// Firebase Configuration and Authentication Helper
// Place this file in your /public folder as: firebase-config.js

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZtiVXvMKX3FodLchIQzIUUqg15htdwyA",
  authDomain: "ai-hebrew.firebaseapp.com",
  projectId: "ai-hebrew",
  storageBucket: "ai-hebrew.firebasestorage.app",
  messagingSenderId: "63571235516",
  appId: "1:63571235516:web:6b81c388fca7d4fc39f6b9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Google Sign-In Function
async function signInWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful:', user.email);
    
    // Save user profile
    const userProfile = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('hebrewMasterProfile', JSON.stringify(userProfile));
    localStorage.setItem('hebrewMasterAuth', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Google sign-in error:', error);
    alert('Sign-in failed: ' + error.message);
    throw error;
  }
}

// Email/Password Sign-Up Function
async function signUpWithEmail(email, password, name) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;
    
    console.log('Email sign-up successful:', user.email);
    
    // Update profile with name
    await user.updateProfile({
      displayName: name
    });
    
    // Save user profile
    const userProfile = {
      uid: user.uid,
      name: name,
      email: user.email,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('hebrewMasterProfile', JSON.stringify(userProfile));
    localStorage.setItem('hebrewMasterAuth', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Sign-up error:', error);
    throw error;
  }
}

// Email/Password Login Function
async function loginWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const user = result.user;
    
    console.log('Email login successful:', user.email);
    
    // Save user profile
    const userProfile = {
      uid: user.uid,
      name: user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('hebrewMasterProfile', JSON.stringify(userProfile));
    localStorage.setItem('hebrewMasterAuth', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Sign Out Function
async function signOut() {
  try {
    await auth.signOut();
    console.log('Sign-out successful');
    
    localStorage.removeItem('hebrewMasterProfile');
    localStorage.removeItem('hebrewMasterAuth');
    localStorage.removeItem('hebrewProgress');
    
    window.location.href = '/';
  } catch (error) {
    console.error('Sign-out error:', error);
    alert('Sign-out failed: ' + error.message);
  }
}

// Check if user is authenticated
function checkAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Auth check: User authenticated -', user.email);
        
        const userProfile = {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('hebrewMasterProfile', JSON.stringify(userProfile));
        localStorage.setItem('hebrewMasterAuth', 'true');
        resolve(user);
      } else {
        console.log('Auth check: No user authenticated');
        localStorage.removeItem('hebrewMasterAuth');
        resolve(null);
      }
    });
  });
}

// Protect dashboard and lesson pages
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    console.log('Access denied: User not authenticated, redirecting to login');
    window.location.href = '/login';
    return null;
  }
  console.log('Access granted: User authenticated');
  return user;
}

// Get current user
function getCurrentUser() {
  return auth.currentUser;
}

// Check if user is authenticated (sync)
function isAuthenticated() {
  return auth.currentUser !== null;
}

console.log('Firebase config loaded successfully');
