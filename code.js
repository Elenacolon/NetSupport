// script.js / login.js
import { auth, db } from "./firebase.js";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM - Elementos del Formulario
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const containerLogin = document.getElementById("containerLogin");
const containerRegistro = document.getElementById("containerRegistro");

const btnIrARegistro = document.getElementById("btnIrARegistro");
const btnIrALogin = document.getElementById("btnIrALogin");

const msgErrorLogin = document.getElementById("msgErrorLogin");
const msgErrorRegistro = document.getElementById("msgErrorRegistro");

// 1. COMMUTACIÓN ENTRE LOGIN Y REGISTRO 
if (btnIrARegistro) {
    btnIrARegistro.addEventListener("click", (e) => {
        e.preventDefault();
        containerLogin.classList.add("oculto");
        containerRegistro.classList.remove("oculto");
        limpiarMensajes();
    });
}

if (btnIrALogin) {
    btnIrALogin.addEventListener("click", (e) => {
        e.preventDefault();
        containerRegistro.classList.add("oculto");
        containerLogin.classList.remove("oculto");
        limpiarMensajes();
    });
}

function limpiarMensajes() {
    if (msgErrorLogin) msgErrorLogin.textContent = "";
    if (msgErrorRegistro) msgErrorRegistro.textContent = "";
}

//2. INICIAR SESIÓN 
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const correo = document.getElementById("correoLogin").value.trim();
        const password = document.getElementById("passLogin").value.trim();

        if (msgErrorLogin) {
            msgErrorLogin.textContent = "Iniciando sesión...";
            msgErrorLogin.style.color = "#3f2183";
        }

        try {
            // Autenticar con Firebase Auth
            await signInWithEmailAndPassword(auth, correo, password);
            
            // Redirigir al Panel de Control
            window.location.href = "panel.html";

        } catch (error) {
            console.error("Error en Login:", error);
            if (msgErrorLogin) {
                msgErrorLogin.style.color = "#e63946";
                switch (error.code) {
                    case "auth/invalid-credential":
                    case "auth/user-not-found":
                    case "auth/wrong-password":
                        msgErrorLogin.textContent = "Correo o contraseña incorrectos.";
                        break;
                    case "auth/invalid-email":
                        msgErrorLogin.textContent = "El formato de correo no es válido.";
                        break;
                    case "auth/too-many-requests":
                        msgErrorLogin.textContent = "Demasiados intentos fallidos. Intenta más tarde.";
                        break;
                    default:
                        msgErrorLogin.textContent = "Error al iniciar sesión: " + error.message;
                }
            }
        }
    });
}

//  3. REGISTRAR NUEVO USUARIO 
if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombreRegistro").value.trim();
        const correo = document.getElementById("correoRegistro").value.trim();
        const password = document.getElementById("passRegistro").value.trim();

        if (msgErrorRegistro) {
            msgErrorRegistro.textContent = "Creando cuenta...";
            msgErrorRegistro.style.color = "#3f2183";
        }

        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
            const user = userCredential.user;

            // 2. Guardar datos del perfil en Firestore (Colección 'Usuarios')
            await setDoc(doc(db, "Usuarios", user.uid), {
                Nombre_Usuario: nombre,
                Correo_Usuario: correo,
                Rol_Usuario: "cliente", // Rol por defecto
                Estado_Usuario: true,    // Usuario activo por defecto
                Fecha_Registro: serverTimestamp()
            });

            if (msgErrorRegistro) {
                msgErrorRegistro.style.color = "#2bc48a";
                msgErrorRegistro.textContent = "¡Cuenta creada con éxito! Redirigiendo...";
            }

            // 3. Redirigir al panel de control
            setTimeout(() => {
                window.location.href = "panel.html";
            }, 1000);

        } catch (error) {
            console.error("Error en Registro:", error);
            if (msgErrorRegistro) {
                msgErrorRegistro.style.color = "#e63946";
                switch (error.code) {
                    case "auth/email-already-in-use":
                        msgErrorRegistro.textContent = "Este correo ya está registrado.";
                        break;
                    case "auth/weak-password":
                        msgErrorRegistro.textContent = "La contraseña debe tener al menos 6 caracteres.";
                        break;
                    case "auth/invalid-email":
                        msgErrorRegistro.textContent = "El correo ingresado no es válido.";
                        break;
                    default:
                        msgErrorRegistro.textContent = "Error al registrarse: " + error.message;
                }
            }
        }
    });
}