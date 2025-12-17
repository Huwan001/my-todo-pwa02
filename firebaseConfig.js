// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- 等一下你會把自己的 Firebase 設定貼到這裡 ---
const firebaseConfig = {
  apiKey: "AIzaSyAMSLR_X2rego57J8CIeij8FbaqVVSUU10",
  authDomain: "my-todo-app-c2f3c.firebaseapp.com",
  projectId: "my-todo-app-c2f3c",
  storageBucket: "my-todo-app-c2f3c.firebasestorage.app",
  messagingSenderId: "238478283546",
  appId: "1:238478283546:web:17a688f89a4eaf37da92a3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
