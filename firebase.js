import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNZsRQ41jmQU_CBkjIuKBeo_X2GNozGao",
  authDomain: "net-support-e5f13.firebaseapp.com",
  projectId: "net-support-e5f13",
  storageBucket: "net-support-e5f13.firebasestorage.app",
  messagingSenderId: "929110669044",
  appId: "1:929110669044:web:03d002bde5a5bd9014d0a1",
  measurementId: "G-7RKMLRDWR9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la base de datos Firestore para que otros archivos la usen
export const db = getFirestore(app);