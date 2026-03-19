importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAHAQjn4sTuR9FiGF3ljRrFEMZQjsx-SHg",
  authDomain: "apni-duniya-b53d7.firebaseapp.com",
  projectId: "apni-duniya-b53d7",
  messagingSenderId: "178853058918",
  appId: "1:178853058918:web:test"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "logo.png"
  });
  
});