importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

firebase.initializeApp({
  "projectId": "elemental-dojo-curico",
  "appId": "1:39532293146:web:0c44ace849aeed5f5335a3",
  "databaseURL": "https://elemental-dojo-curico-default-rtdb.firebaseio.com",
  "storageBucket": "elemental-dojo-curico.firebasestorage.app",
  "apiKey": "AIzaSyCdp2xekXWXGorVDXtGwzC73N-F4_Ig4gU",
  "authDomain": "elemental-dojo-curico.firebaseapp.com",
  "messagingSenderId": "39532293146",
  "measurementId": "G-YMBD4QWWMY",
  "projectNumber": "39532293146",
  "version": "2"
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
