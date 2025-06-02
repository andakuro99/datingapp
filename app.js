// app.js
const firebaseConfig = {
  apiKey: "AIzaSyB1feasCX5NEpDBOU5umS_t-NOkbIsL2iM",
  authDomain: "datingapp-f7ce2.firebaseapp.com",
  projectId: "datingapp-f7ce2",
  storageBucket: "datingapp-f7ce2.appspot.com",
  messagingSenderId: "772330309967",
  appId: "1:772330309967:web:your-app-id"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// Helper: Show/Hide Panels
function showPanel(panel) {
  document.querySelectorAll('.card').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${panel}-section`).classList.remove('hidden');
}

// Sign Up
function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password).then(() => {
    alert("Signed up successfully");
    showPanel('info');
  }).catch(alert);
}

// Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password).then(() => {
    alert("Logged in successfully");
  }).catch(alert);
}

// Auth State
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById('userEmail').innerText = user.email;
    document.getElementById('verifiedBadge').innerText = user.emailVerified ? '✔️' : '';
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        showPanel('profile');
        if (user.email === 'admin@example.com') {
          document.getElementById('admin-btn').classList.remove('hidden');
        }
      } else {
        showPanel('info');
      }
    });
  } else {
    showPanel('auth');
  }
});

// Submit User Info
function submitUserInfo() {
  const name = document.getElementById('name').value;
  const age = document.getElementById('age').value;
  const country = document.getElementById('country').value;
  const gender = document.getElementById('gender').value;
  db.collection('users').doc(currentUser.uid).set({ name, age, country, gender });
  showPanel('profile');
}

// Swipe Logic
let swipeQueue = [];
function loadSwipe() {
  db.collection('users').get().then(snapshot => {
    swipeQueue = snapshot.docs.filter(doc => doc.id !== currentUser.uid);
    showNextSwipe();
    showPanel('swipe');
  });
}
function showNextSwipe() {
  const swipeUser = swipeQueue.pop();
  if (!swipeUser) return document.getElementById('swipe-user').innerText = 'No more users';
  document.getElementById('swipe-user').innerText = `${swipeUser.data().name} (${swipeUser.data().age})`;
  document.getElementById('swipe-user').dataset.id = swipeUser.id;
}
function swipe(action) {
  if (action === 'like') {
    const likedId = document.getElementById('swipe-user').dataset.id;
    db.collection('likes').add({ from: currentUser.uid, to: likedId });
    db.collection('likes').where('from', '==', likedId).where('to', '==', currentUser.uid)
      .get().then(snapshot => {
        if (!snapshot.empty) {
          document.getElementById('match-sound').play();
          alert('It's a match!');
        }
      });
  }
  showNextSwipe();
}

// Messaging
function showMessages() {
  showPanel('message');
}
function sendMessage() {
  const toId = document.getElementById('chat-user-id').value;
  const text = document.getElementById('chat-input').value;
  db.collection('messages').add({ from: currentUser.uid, to: toId, text, time: Date.now() });
  document.getElementById('chat-input').value = '';
  document.getElementById('message-sound').play();
  loadMessages(toId);
}
function loadMessages(toId) {
  db.collection('messages').where('from', 'in', [currentUser.uid, toId]).where('to', 'in', [currentUser.uid, toId])
    .orderBy('time').get().then(snapshot => {
      const box = document.getElementById('chat-box');
      box.innerHTML = '';
      snapshot.forEach(doc => {
        box.innerHTML += `<div><b>${doc.data().from === currentUser.uid ? 'You' : 'Them'}:</b> ${doc.data().text}</div>`;
      });
      box.scrollTop = box.scrollHeight;
    });
}

// Edit Profile
function showEdit() {
  showPanel('edit');
}
function updateProfile() {
  const name = document.getElementById('edit-name').value;
  const age = document.getElementById('edit-age').value;
  db.collection('users').doc(currentUser.uid).update({ name, age });
  showPanel('profile');
}

// Report & Block
function reportUser() {
  const id = document.getElementById('report-user-id').value;
  db.collection('reports').add({ reporter: currentUser.uid, reported: id });
  alert('Reported');
}
function blockUser() {
  const id = document.getElementById('report-user-id').value;
  db.collection('blocks').add({ blocker: currentUser.uid, blocked: id });
  alert('Blocked');
}

// Admin
function loadReports() {
  db.collection('reports').get().then(snapshot => {
    const list = document.getElementById('report-list');
    list.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      list.innerHTML += `<div>Reporter: ${data.reporter}, Reported: ${data.reported}</div>`;
    });
    showPanel('admin');
  });
}
