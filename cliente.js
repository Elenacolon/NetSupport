import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    where,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/*  0. CERRAR SESIÓN Y MODO VISTA */
function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

function cambiarModoVista(nuevoRol) {
    if (nuevoRol === "administrador" || nuevoRol === "admin") {
        window.location.href = "admin.html"; // O redirigir a la vista correspondiente
    } else if (nuevoRol === "tecnico") {
        window.location.href = "tecnico.html";
    }
}
window.cambiarModoVista = cambiarModoVista;

/* 1. VERIFICACIÓN DE SESIÓN */
const usuarioGuardado = sessionStorage.getItem("usuario");

if (!usuarioGuardado) {
    window.location.href = "login.html";
}

const usuario = JSON.parse(usuarioGuardado);

/* 2. INICIALIZACIÓN */
document.addEventListener("DOMContentLoaded", () => {
    const nombreClienteEl = document.getElementById("nombreCliente");
    if (nombreClienteEl) {
        nombreClienteEl.textContent = usuario.nombre || "Cliente";
    }

    const selectRol = document.getElementById("selectRolCliente");
    if (selectRol) {
        selectRol.value = "cliente";
    }

    mostrarCliente('inicio');
});

/* 3. NAVEGACIÓN Y VISTAS DEL CLIENTE */
function mostrarCliente(seccion) {
    const itemsMenu = document.querySelectorAll("#clientePanel .sidebar li");
    itemsMenu.forEach(item => item.classList.remove("active"));

    const menuActivo = document.getElementById(`cmenu-${seccion}`);
    if (menuActivo) menuActivo.classList.add("active");

    const contenedor = document.getElementById("clienteContenido");
    if (!contenedor) return;

    if (seccion === 'inicio') {
        contenedor.innerHTML = `
            <div class="main-card">
                <h2>Estado de tu Servicio</h2>
                <p style="margin-top:10px; font-size:16px;">¡Hola, <strong>${usuario.nombre}</strong>! Tu servicio de red se encuentra actualmente <span style="color:green; font-weight:bold;">ACTIVO</span>.</p>
            </div>`;
    } else if (seccion === 'plan') {
        contenedor.innerHTML = `
            <div class="main-card">
                <h2>Planes Disponibles para Ti</h2>
                <div id="listaPlanesCliente" style="margin-top:15px;">Cargando planes...</div>
            </div>`;
        cargarPlanesCliente();

    } else if (seccion === 'soporte') {
        contenedor.innerHTML = `
            <div class="main-card">
                <h2>Reportar Avería o Solicitar Soporte Técnico</h2>
                <form id="formSoporteCliente" style="margin-top:15px; display:flex; flex-direction:column; gap:12px; max-width:500px;">
                    <label style="font-weight:bold;">Describe el problema o fallo técnico:</label>
                    <textarea id="detalleAveria" rows="4" style="padding:10px; border-radius:8px; border:1px solid #ccc; font-family:inherit;" required placeholder="Ejemplo: No tengo señal de internet desde esta mañana..."></textarea>
                    <button type="submit" style="padding:12px; background:#6c5ce7; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Enviar Reporte</button>
                </form>
                <div id="msgSoporte" style="margin-top:10px;"></div>
            </div>
            
            <div class="main-card" style="margin-top:20px;">
                <h2>Mis Reportes Enviados</h2>
                <div id="misReportesCliente" style="margin-top:10px;">Cargando mis averías...</div>
            </div>`;

        const form = document.getElementById("formSoporteCliente");
        if (form) form.addEventListener("submit", registrarSolicitudCliente);

        cargarMisAveriasCliente();

    } else if (seccion === 'perfil') {
        contenedor.innerHTML = `
            <div class="main-card">
                <h2>Información Personal</h2>
                <p style="margin-top:10px;"><strong>Nombre:</strong> ${usuario.nombre}</p>
                <p style="margin-top:5px;"><strong>Correo:</strong> ${usuario.correo}</p>
                <p style="margin-top:5px;"><strong>Rol:</strong> Cliente</p>
            </div>`;
    }
}
window.mostrarCliente = mostrarCliente;

/* 4. OPERACIONES CON FIRESTORE */
async function cargarPlanesCliente() {
    const cont = document.getElementById("listaPlanesCliente");
    if (!cont) return;

    try {
        const snap = await getDocs(collection(db, "Planes"));
        if (snap.empty) {
            cont.innerHTML = `<p>No hay planes disponibles por el momento.</p>`;
            return;
        }

        let html = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:15px;">`;
        snap.forEach((docSnap) => {
            const p = docSnap.data();
            html += `
                <div style="border:1px solid #ddd; padding:15px; border-radius:10px; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="color:#6c5ce7; margin-bottom:8px;">${p.nombre}</h3>
                    <p style="margin:4px 0;"><strong>Velocidad:</strong> ${p.velocidad}</p>
                    <p style="margin:4px 0;"><strong>Precio:</strong> $${p.precio} / mes</p>
                </div>`;
        });
        cont.innerHTML = html + `</div>`;
    } catch (err) {
        console.error("Error al cargar planes:", err);
    }
}

async function cargarMisAveriasCliente() {
    const cont = document.getElementById("misReportesCliente");
    if (!cont) return;

    try {
        const q = query(collection(db, "Solicitudes"), where("correo", "==", usuario.correo));
        const snap = await getDocs(q);

        if (snap.empty) {
            cont.innerHTML = `<p style="color:#666;">No has realizado ningún reporte de avería aún.</p>`;
            return;
        }

        let html = `<table style="width:100%; text-align:left; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid #ddd;"><th>Fecha</th><th>Detalle</th><th>Estado</th></tr></thead><tbody>`;

        snap.forEach((docSnap) => {
            const data = docSnap.data();
            const fechaFormateada = data.fecha ? new Date(data.fecha).toLocaleDateString() : '-';
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${fechaFormateada}</td>
                <td style="padding:10px;">${data.detalle}</td>
                <td style="padding:10px;"><span style="background:#e8f4f8; color:#0984e3; padding:4px 8px; border-radius:5px; font-weight:bold;">${data.estado || 'Pendiente'}</span></td>
            </tr>`;
        });
        cont.innerHTML = html + `</tbody></table>`;
    } catch (err) {
        console.error("Error al obtener reportes del cliente:", err);
    }
}

async function registrarSolicitudCliente(e) {
    e.preventDefault();
    const detalle = document.getElementById("detalleAveria").value.trim();
    const msg = document.getElementById("msgSoporte");

    if (!detalle) return;

    try {
        await addDoc(collection(db, "Solicitudes"), {
            cliente: usuario.nombre || "Cliente",
            correo: usuario.correo,
            tipo: "Avería / Soporte",
            detalle: detalle,
            estado: "Pendiente",
            fecha: new Date().toISOString()
        });

        msg.innerHTML = `<span style="color:green; font-weight:bold;">Reporte de avería enviado correctamente.</span>`;
        document.getElementById("formSoporteCliente").reset();
        cargarMisAveriasCliente();
    } catch (err) {
        console.error("Error al guardar solicitud:", err);
        msg.innerHTML = `<span style="color:red;">Error al enviar la solicitud. Intente nuevamente.</span>`;
    }
}