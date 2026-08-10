import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/*  ELEMENTOS DEL DOM */
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

const showRegister = document.getElementById("showRegister");
const backLogin = document.getElementById("backLogin");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const togglePassword = document.getElementById("togglePassword");
const loginPassword = document.getElementById("loginPassword");

/*  1. INTERFAZ Y NAVEGACIÓN */
if (showRegister && backLogin) {
    showRegister.addEventListener("click", () => {
        if (loginSection) loginSection.classList.add("login-hidden");
        if (registerSection) registerSection.classList.remove("login-hidden");
        limpiarMensajes();
    });

    backLogin.addEventListener("click", () => {
        if (registerSection) registerSection.classList.add("login-hidden");
        if (loginSection) loginSection.classList.remove("login-hidden");
        limpiarMensajes();
    });
}

if (togglePassword && loginPassword) {
    togglePassword.addEventListener("click", () => {
        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            togglePassword.textContent = "Ocultar";
        } else {
            loginPassword.type = "password";
            togglePassword.textContent = "Ver";
        }
    });
}

function mostrarMensaje(elemento, mensaje, color) {
    if (elemento) {
        elemento.textContent = mensaje;
        elemento.style.color = color;
    }
}

function limpiarMensajes() {
    if (loginMessage) loginMessage.textContent = "";
    if (registerMessage) registerMessage.textContent = "";
}

/*  2. REGISTRAR USUARIO */
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const nombre = document.getElementById("registerName").value.trim();
        const correo = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmar = document.getElementById("confirmPassword").value;

        if (!nombre || !correo || !password || !confirmar) {
            mostrarMensaje(registerMessage, "Complete todos los campos.", "red");
            return;
        }

        if (password !== confirmar) {
            mostrarMensaje(registerMessage, "Las contraseñas no coinciden.", "red");
            return;
        }

        try {
            const consulta = query(
                collection(db, "Usuarios"),
                where("correo", "==", correo)
            );

            const resultado = await getDocs(consulta);

            if (!resultado.empty) {
                mostrarMensaje(registerMessage, "Este correo ya está registrado.", "red");
                return;
            }

            await addDoc(collection(db, "Usuarios"), {
                nombre: nombre,
                correo: correo,
                contraseña: password,
                rol_usuario: "cliente"
            });

            mostrarMensaje(registerMessage, "Cuenta creada correctamente.", "green");
            registerForm.reset();

            setTimeout(() => {
                if (registerSection) registerSection.classList.add("login-hidden");
                if (loginSection) loginSection.classList.remove("login-hidden");
                limpiarMensajes();
            }, 2000);

        } catch (error) {
            console.error("Error al registrar:", error);
            mostrarMensaje(registerMessage, "Error al crear la cuenta.", "red");
        }
    });
}

/*  3. INICIAR SESIÓN */
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const correo = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        if (!correo || !password) {
            mostrarMensaje(loginMessage, "Complete todos los campos.", "red");
            return;
        }

        try {
            const consulta = query(
                collection(db, "Usuarios"),
                where("correo", "==", correo)
            );

            const resultado = await getDocs(consulta);

            if (resultado.empty) {
                // El correo no existe todavía: lo registramos automáticamente como cliente
                const nuevoUsuario = {
                    nombre: correo.split("@")[0],
                    correo: correo,
                    contraseña: password,
                    rol_usuario: "cliente"
                };

                await addDoc(collection(db, "Usuarios"), nuevoUsuario);

                mostrarMensaje(loginMessage, "Cuenta creada. Iniciando sesión como cliente...", "green");

                sessionStorage.setItem("usuario", JSON.stringify(nuevoUsuario));

                setTimeout(() => {
                    window.location.href = "panel.html";
                }, 1000);

                return;
            }

            let usuario = null;
            resultado.forEach((doc) => {
                usuario = doc.data();
            });

            if (usuario.contraseña !== password) {
                mostrarMensaje(loginMessage, "Contraseña incorrecta.", "red");
                return;
            }

            mostrarMensaje(loginMessage, "Inicio de sesión exitoso.", "green");

            sessionStorage.setItem("usuario", JSON.stringify(usuario));

            const rol = (usuario.rol_usuario || "cliente").toLowerCase().trim();
            let destino = "panel.html";

            if (rol === "administrador" || rol === "admin") {
                destino = "admin.html";
            } else if (rol === "tecnico") {
                destino = "panel.html";
            }

            setTimeout(() => {
                window.location.href = destino;
            }, 1000);

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            mostrarMensaje(loginMessage, "Error al iniciar sesión.", "red");
        }
    });
}