class StateManager {
  constructor() {
    this.cache = {};
    this.userId = null;
    this.listeners = {};
    
    if (window.FirebaseApp && window.FirebaseApp.auth) {
      window.FirebaseApp.auth.onAuthStateChanged((user) => {
        if (user) {
          this.userId = user.uid;
          this.loadAllData();
        } else {
          this.userId = null;
          this.cache = {};
        }
      });
    }
  }

  async set(key, value) {
    if (!this.userId) {
      console.warn('⚠️ No user logged in, storing in session only');
      this.cache[key] = value;
      return;
    }

    try {
      this.cache[key] = value;

      await window.FirebaseApp.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc(key)
        .set({
          value: value,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      this.notifyListeners(key, value);

      console.log('✅ Saved to Firestore:', key);
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
    }
  }

  async get(key, defaultValue = null) {
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }

    if (!this.userId) {
      console.warn('⚠️ No user logged in, returning default value');
      return defaultValue;
    }

    try {
      const doc = await window.FirebaseApp.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc(key)
        .get();

      if (doc.exists) {
        const value = doc.data().value;
        this.cache[key] = value;
        return value;
      } else {
        return defaultValue;
      }
    } catch (error) {
      console.error('❌ Error getting from Firestore:', error);
      return defaultValue;
    }
  }

  async remove(key) {
    if (!this.userId) {
      delete this.cache[key];
      return;
    }

    try {
      delete this.cache[key];

      await window.FirebaseApp.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc(key)
        .delete();

      console.log('✅ Removed from Firestore:', key);
    } catch (error) {
      console.error('❌ Error removing from Firestore:', error);
    }
  }

  async clear() {
    this.cache = {};

    if (!this.userId) return;

    try {
      const snapshot = await window.FirebaseApp.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .get();

      const batch = window.FirebaseApp.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Cleared all data from Firestore');
    } catch (error) {
      console.error('❌ Error clearing Firestore:', error);
    }
  }

  async saveUserProfile(profile) {
    await this.set('userProfile', profile);
  }

  async getUserProfile() {
    return await this.get('userProfile', {});
  }

  async saveProgress(lessonId, completed = true) {
    const progress = await this.get('progress', {});
    progress[lessonId] = {
      completed,
      completedAt: new Date().toISOString(),
    };
    await this.set('progress', progress);

    if (this.userId) {
      await window.FirebaseApp.updateUserProgress(this.userId, lessonId, completed);
    }
  }

  async getProgress() {
    return await this.get('progress', {});
  }

  async updateStreak() {
    const lastStudyDate = await this.get('lastStudyDate');
    const today = new Date().toDateString();

    if (lastStudyDate === today) {
      return;
    }

    let streak = await this.get('studyStreak', 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastStudyDate === yesterday.toDateString()) {
      streak++;
    } else if (lastStudyDate !== today) {
      streak = 1;
    }

    await this.set('studyStreak', streak);
    await this.set('lastStudyDate', today);
  }

  async getStreak() {
    return await this.get('studyStreak', 0);
  }

  async loadAllData() {
    if (!this.userId) return;

    try {
      const snapshot = await window.FirebaseApp.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .get();

      snapshot.forEach((doc) => {
        this.cache[doc.id] = doc.data().value;
      });

      console.log('✅ Loaded all data from Firestore');
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  }

  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
  }

  unsubscribe(key, callback) {
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    }
  }

  notifyListeners(key, value) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(value));
    }
  }
}

window.StateManager = new StateManager();

console.log('💾 State Manager initialized (localStorage replacement)');

window.migrateFromLocalStorage = async function() {
  if (!window.StateManager.userId) {
    console.error('❌ User must be logged in to migrate');
    return;
  }

  console.log('🔄 Starting migration from localStorage...');

  const keysToMigrate = [
    'hebrewMasterProfile',
    'hebrewMasterAuth',
    'hebrewProgress',
    'studyStreak',
    'lastStudyDate',
  ];

  for (const key of keysToMigrate) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        await window.StateManager.set(key, parsed);
        console.log('✅ Migrated:', key);
      } catch {
        await window.StateManager.set(key, value);
        console.log('✅ Migrated:', key);
      }
    }
  }

  console.log('✅ Migration complete!');
};
