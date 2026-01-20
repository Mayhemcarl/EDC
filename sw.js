importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCdp2xekXWXGorVDXtGwzC73N-F4_Ig4gU",
  authDomain: "elemental-dojo-curico.firebaseapp.com",
  projectId: "elemental-dojo-curico",
  storageBucket: "elemental-dojo-curico.firebasestorage.app",
  messagingSenderId: "39532293146",
  appId: "1:39532293146:web:0c44ace849aeed5f5335a3",
  measurementId: "G-YMBD4QWWMY"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Notificación";
  const options = {
    body: payload?.notification?.body || "",
    data: payload?.data || {}
  };
  self.registration.showNotification(title, options);
});
