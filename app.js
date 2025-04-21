// Import Firebase functions
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, addDoc, onSnapshot, query, orderBy, limit, getDocs, deleteDoc, doc, setDoc, serverTimestamp, updateDoc, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Firebase
window.initFirebase();
const auth = window.auth;
const db = window.db;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const chatList = document.getElementById('chat-list');
const messages = document.getElementById('messages');
const messageText = document.getElementById('message-text');
const sendButton = document.getElementById('send-button');
const newRoomBtn = document.getElementById('new-room-btn');
const roomName = document.getElementById('room-name');
const onlineUsers = document.getElementById('online-users');

// Variables
let currentUser = null;
let currentRoom = 'general';
let unsubscribeMessages = null;
let unsubscribeUsers = null;

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.email.split('@')[0],
            photoURL: 'https://api.dicebear.com/7.x/avatars/svg?seed=' + user.uid
        };
        showApp();
        setupUserProfile();
        joinRoom(currentRoom);
    } else {
        showAuth();
        if (unsubscribeMessages) unsubscribeMessages();
        if (unsubscribeUsers) unsubscribeUsers();
    }
});

// Authentication Functions
loginBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
    }
});

signupBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
        alert(error.message);
    }
});

// UI Functions
function showAuth() {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
}

function setupUserProfile() {
    userName.textContent = currentUser.displayName;
    userPhoto.style.backgroundImage = `url(${currentUser.photoURL})`;
}

// Chat Functions
async function joinRoom(roomId) {
    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeUsers) unsubscribeUsers();
    
    // Leave previous room
    if (currentRoom) {
        const userRef = doc(db, 'rooms', currentRoom, 'online', currentUser.uid);
        await deleteDoc(userRef);
    }
    
    currentRoom = roomId;
    roomName.textContent = document.querySelector(`[data-room="${roomId}"]`).textContent;
    messages.innerHTML = '';
    
    // Subscribe to messages
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().reverse().forEach((change) => {
            if (change.type === 'added') {
                displayMessage(change.doc.data());
            }
        });
        messages.scrollTop = messages.scrollHeight;
    });
    
    // Set online status
    const userRef = doc(db, 'rooms', roomId, 'online', currentUser.uid);
    await setDoc(userRef, {
        displayName: currentUser.displayName,
        lastSeen: serverTimestamp()
    });
    
    // Keep online status fresh
    const keepAlive = setInterval(async () => {
        if (currentRoom === roomId) {
            await updateDoc(userRef, {
                lastSeen: serverTimestamp()
            }).catch(console.error);
        } else {
            clearInterval(keepAlive);
        }
    }, 30000);
    
    // Subscribe to online users
    const onlineRef = collection(db, 'rooms', roomId, 'online');
    unsubscribeUsers = onSnapshot(onlineRef, (snapshot) => {
        const now = Date.now();
        let count = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.lastSeen) {
                const lastSeen = data.lastSeen.toDate();
                if ((now - lastSeen) < 60000) { // Less than 1 minute
                    count++;
                } else {
                    deleteDoc(doc.ref).catch(console.error);
                }
            }
        });
        
        onlineUsers.textContent = `${count} online`;
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (currentRoom && currentUser) {
        const userRef = doc(db, 'rooms', currentRoom, 'online', currentUser.uid);
        deleteDoc(userRef).catch(console.error);
    }
});

// Message Functions
async function sendMessage() {
    const text = messageText.value.trim();
    
    if (!text) return;
    
    const messageData = {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        timestamp: new Date(),
        text: text
    };
    
    await addDoc(collection(db, 'rooms', currentRoom, 'messages'), messageData);
    messageText.value = '';
    messageText.focus();
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    const isSentByCurrentUser = message.uid === currentUser.uid;
    
    messageElement.className = `message ${isSentByCurrentUser ? 'message-sent' : 'message-received'}`;
    
    const messageInfo = document.createElement('div');
    messageInfo.className = 'message-info';
    messageInfo.textContent = `${isSentByCurrentUser ? 'You' : message.displayName} • ${new Date(message.timestamp.seconds * 1000).toLocaleTimeString()}`;
    
    const messageContent = document.createElement('div');
    messageContent.textContent = message.text;
    
    messageElement.appendChild(messageInfo);
    messageElement.appendChild(messageContent);
    messages.appendChild(messageElement);
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageText.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chatList.addEventListener('click', e => {
    const chatItem = e.target.closest('.chat-item');
    if (chatItem) {
        document.querySelector('.chat-item.active').classList.remove('active');
        chatItem.classList.add('active');
        joinRoom(chatItem.dataset.room);
    }
});

newRoomBtn.addEventListener('click', async () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
        const roomId = roomName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-item';
        roomElement.dataset.room = roomId;
        roomElement.textContent = roomName;
        chatList.insertBefore(roomElement, newRoomBtn);
        joinRoom(roomId);
    }
});