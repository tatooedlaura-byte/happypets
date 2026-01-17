// Firebase Configuration for Happy Pets
// Using CDN version (no build system required)

const firebaseConfig = {
  apiKey: "AIzaSyDhMJ3Xse7KYtCrRUzpHiDFifOaRHTydCw",
  authDomain: "happypets-c64bf.firebaseapp.com",
  projectId: "happypets-c64bf",
  storageBucket: "happypets-c64bf.firebasestorage.app",
  messagingSenderId: "482218018369",
  appId: "1:482218018369:web:1ec227fb50650f19c968c0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// ============================================
// SESSION MANAGEMENT
// ============================================

function getCurrentFamily() {
  const familyId = sessionStorage.getItem('happypets_familyId');
  const familyName = sessionStorage.getItem('happypets_familyName');
  if (familyId && familyName) {
    return { id: familyId, name: familyName };
  }
  return null;
}

function setCurrentFamily(familyId, familyName) {
  sessionStorage.setItem('happypets_familyId', familyId);
  sessionStorage.setItem('happypets_familyName', familyName);
}

function clearCurrentFamily() {
  sessionStorage.removeItem('happypets_familyId');
  sessionStorage.removeItem('happypets_familyName');
  sessionStorage.removeItem('happypets_memberId');
  sessionStorage.removeItem('happypets_memberName');
}

function getCurrentMember() {
  const memberId = sessionStorage.getItem('happypets_memberId');
  const memberName = sessionStorage.getItem('happypets_memberName');
  const memberAvatar = sessionStorage.getItem('happypets_memberAvatar');
  const isParent = sessionStorage.getItem('happypets_memberIsParent') === 'true';
  if (memberId && memberName) {
    return { id: memberId, name: memberName, avatar: memberAvatar || '👤', isParent };
  }
  return null;
}

function setCurrentMember(memberId, memberName, memberAvatar, isParent) {
  sessionStorage.setItem('happypets_memberId', memberId);
  sessionStorage.setItem('happypets_memberName', memberName);
  sessionStorage.setItem('happypets_memberAvatar', memberAvatar || '👤');
  sessionStorage.setItem('happypets_memberIsParent', isParent ? 'true' : 'false');
}

function isCurrentMemberParent() {
  return sessionStorage.getItem('happypets_memberIsParent') === 'true';
}

// ============================================
// AUTH CHECK
// ============================================

function requireAuth() {
  const family = getCurrentFamily();
  if (!family) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ============================================
// FAMILY AUTHENTICATION
// ============================================

async function signUp(username, password, familyName) {
  // Check if username already exists
  const existing = await db.collection('families')
    .where('username', '==', username.toLowerCase())
    .get();

  if (!existing.empty) {
    throw new Error('Username already taken');
  }

  // Create family document
  const familyRef = await db.collection('families').add({
    username: username.toLowerCase(),
    password: password, // In production, hash this!
    familyName: familyName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Initialize kindness document
  await familyRef.collection('kindness').doc('stats').set({
    total: 0,
    byMember: {}
  });

  // Set session
  setCurrentFamily(familyRef.id, familyName);

  return { id: familyRef.id, familyName };
}

async function login(username, password) {
  const snapshot = await db.collection('families')
    .where('username', '==', username.toLowerCase())
    .where('password', '==', password)
    .get();

  if (snapshot.empty) {
    throw new Error('Invalid username or password');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Set session
  setCurrentFamily(doc.id, data.familyName);

  return { id: doc.id, familyName: data.familyName };
}

function logout() {
  clearCurrentFamily();
  window.location.href = 'login.html';
}

// ============================================
// FAMILY MEMBERS
// ============================================

async function getMembers() {
  const family = getCurrentFamily();
  if (!family) return [];

  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('members')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function addMember(name, avatar, color, isParent = false) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  const memberRef = await db.collection('families')
    .doc(family.id)
    .collection('members')
    .add({
      name,
      avatar: avatar || '👤',
      color: color || '#7C9FE8',
      isParent,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

  return { id: memberRef.id, name, avatar, color, isParent };
}

async function updateMember(memberId, updates) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  await db.collection('families')
    .doc(family.id)
    .collection('members')
    .doc(memberId)
    .update(updates);
}

async function deleteMember(memberId) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  await db.collection('families')
    .doc(family.id)
    .collection('members')
    .doc(memberId)
    .delete();
}

// ============================================
// PETS (FIRESTORE)
// ============================================

async function getPetsFromFirestore() {
  const family = getCurrentFamily();
  if (!family) return [];

  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('pets')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getPetFromFirestore(petId) {
  const family = getCurrentFamily();
  if (!family || !family.id) return null;
  if (!petId) return null;

  const doc = await db.collection('families')
    .doc(family.id)
    .collection('pets')
    .doc(petId)
    .get();

  if (!doc.exists) return null;

  return { id: doc.id, ...doc.data() };
}

async function addPetToFirestore(petData) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  const petRef = await db.collection('families')
    .doc(family.id)
    .collection('pets')
    .add({
      name: petData.name,
      type: petData.type,
      breed: petData.breed || '',
      tasks: petData.tasks || [],
      customTasks: petData.customTasks || [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

  return { id: petRef.id, ...petData };
}

async function updatePetInFirestore(petId, updates) {
  const family = getCurrentFamily();
  if (!family || !family.id) throw new Error('Not logged in');
  if (!petId) throw new Error('Pet ID is required');

  await db.collection('families')
    .doc(family.id)
    .collection('pets')
    .doc(petId)
    .update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function deletePetFromFirestore(petId) {
  const family = getCurrentFamily();
  if (!family || !family.id) throw new Error('Not logged in');
  if (!petId) throw new Error('Pet ID is required');

  // Delete pet document
  await db.collection('families')
    .doc(family.id)
    .collection('pets')
    .doc(petId)
    .delete();

  // Also delete task completions for this pet
  const completions = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .where('petId', '==', petId)
    .get();

  const batch = db.batch();
  completions.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

// ============================================
// TASK COMPLETIONS (FIRESTORE)
// ============================================

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

async function getTaskCompletionsFromFirestore() {
  const family = getCurrentFamily();
  if (!family) return {};

  const today = getTodayKey();

  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .where('date', '==', today)
    .get();

  const completions = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.petId}_${data.taskId}_${data.date}`;
    completions[key] = {
      id: doc.id,
      ...data
    };
  });

  return completions;
}

async function isTaskCompleteInFirestore(petId, taskId) {
  const family = getCurrentFamily();
  if (!family || !family.id) return false;
  if (!petId || !taskId) return false;

  const today = getTodayKey();
  const docId = `${today}_${petId}_${taskId}`;

  const doc = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .doc(docId)
    .get();

  return doc.exists;
}

async function getTaskCompletionDetails(petId, taskId) {
  const family = getCurrentFamily();
  if (!family || !family.id) return null;
  if (!petId || !taskId) return null;

  const today = getTodayKey();
  const docId = `${today}_${petId}_${taskId}`;

  const doc = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .doc(docId)
    .get();

  if (!doc.exists) return null;

  return doc.data();
}

async function toggleTaskInFirestore(petId, taskId, requiresApproval = false) {
  const family = getCurrentFamily();
  if (!family || !family.id) throw new Error('Not logged in');
  if (!petId || !taskId) throw new Error('Pet ID and Task ID are required');

  const member = getCurrentMember();
  const isParent = member ? member.isParent : false;
  const today = getTodayKey();
  const docId = `${today}_${petId}_${taskId}`;

  const docRef = db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .doc(docId);

  const doc = await docRef.get();

  if (doc.exists) {
    const data = doc.data();
    // If pending and user is parent, this is an approval
    if (data.status === 'pending' && isParent) {
      await docRef.update({
        status: 'approved',
        approvedBy: member.id,
        approvedByName: member.name,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Add kindness now that it's approved
      await addKindnessToFirestore(data.completedBy);
      return true;
    }
    // Otherwise, mark as incomplete (delete)
    await docRef.delete();
    return false;
  } else {
    // Task was incomplete, mark as complete
    const needsApproval = requiresApproval && !isParent;

    await docRef.set({
      petId,
      taskId,
      date: today,
      completedBy: member ? member.id : null,
      completedByName: member ? member.name : 'Someone',
      completedByAvatar: member ? member.avatar : '👤',
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: needsApproval ? 'pending' : 'approved'
    });

    // Only add to kindness if approved (or doesn't need approval)
    if (!needsApproval) {
      await addKindnessToFirestore(member ? member.id : null);
    }

    return true;
  }
}

async function getPendingApprovals() {
  const family = getCurrentFamily();
  if (!family) return [];

  const today = getTodayKey();

  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .where('status', '==', 'pending')
    .where('date', '==', today)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function approveTask(completionId) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  const member = getCurrentMember();
  if (!member || !member.isParent) throw new Error('Only parents can approve tasks');

  const docRef = db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .doc(completionId);

  const doc = await docRef.get();
  if (!doc.exists) throw new Error('Task not found');

  const data = doc.data();

  await docRef.update({
    status: 'approved',
    approvedBy: member.id,
    approvedByName: member.name,
    approvedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Add kindness for the person who completed it
  await addKindnessToFirestore(data.completedBy);
}

async function rejectTask(completionId) {
  const family = getCurrentFamily();
  if (!family) throw new Error('Not logged in');

  const member = getCurrentMember();
  if (!member || !member.isParent) throw new Error('Only parents can reject tasks');

  await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .doc(completionId)
    .delete();
}

async function getCompletedTasksForPetFromFirestore(petId) {
  const family = getCurrentFamily();
  if (!family) return 0;

  const today = getTodayKey();

  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .where('petId', '==', petId)
    .where('date', '==', today)
    .get();

  return snapshot.size;
}

// ============================================
// KINDNESS JAR (FIRESTORE)
// ============================================

async function getKindnessFromFirestore() {
  const family = getCurrentFamily();
  if (!family) return { total: 0, byMember: {} };

  const doc = await db.collection('families')
    .doc(family.id)
    .collection('kindness')
    .doc('stats')
    .get();

  if (!doc.exists) {
    return { total: 0, byMember: {} };
  }

  return doc.data();
}

async function addKindnessToFirestore(memberId) {
  const family = getCurrentFamily();
  if (!family) return;

  const docRef = db.collection('families')
    .doc(family.id)
    .collection('kindness')
    .doc('stats');

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);

    let data = doc.exists ? doc.data() : { total: 0, byMember: {} };

    data.total = (data.total || 0) + 1;

    if (memberId) {
      data.byMember = data.byMember || {};
      data.byMember[memberId] = (data.byMember[memberId] || 0) + 1;
    }

    transaction.set(docRef, data);
  });
}

function getKindnessLevel(kindnessData) {
  const total = kindnessData?.total || 0;
  return Math.min(100, (total % 20) * 5 + 5);
}

// ============================================
// MEMBER STATS
// ============================================

async function getMemberStats() {
  const family = getCurrentFamily();
  if (!family) return {};

  const today = getTodayKey();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoKey = weekAgo.toISOString().split('T')[0];

  // Get all task completions
  const snapshot = await db.collection('families')
    .doc(family.id)
    .collection('taskCompletions')
    .get();

  const stats = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const memberId = data.completedBy;
    if (!memberId) return;

    if (!stats[memberId]) {
      stats[memberId] = {
        today: 0,
        thisWeek: 0,
        total: 0,
        name: data.completedByName || 'Unknown',
        avatar: data.completedByAvatar || '👤'
      };
    }

    stats[memberId].total++;

    if (data.date === today) {
      stats[memberId].today++;
    }

    if (data.date >= weekAgoKey) {
      stats[memberId].thisWeek++;
    }
  });

  return stats;
}

async function getMemberStatsForMember(memberId) {
  const stats = await getMemberStats();
  return stats[memberId] || { today: 0, thisWeek: 0, total: 0 };
}

console.log('Firebase initialized for Happy Pets');
