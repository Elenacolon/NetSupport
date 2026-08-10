import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* 0. CERRAR SESIÓN Y CAMBIO DE MODO VISTA */
function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

function cambiarModoVista(nuevoRol) {
    if (nuevoRol === "cliente" || nuevoRol === "tecnico") {
        window.location.href = "panel.html";
    }
}
window.cambiarModoVista = cambiarModoVista;

/* 1. VERIFICACIÓN DE SESIÓN Y ROL*/
const usuarioGuardado = sessionStorage.getItem("usuario");

if (!usuarioGuardado) {
    window.location.href = "login.html";
}

const usuario = JSON.parse(usuarioGuardado || "{}");
const rolUsuario = (usuario.rol_usuario || "").toLowerCase();

if (rolUsuario !== "administrador" && rolUsuario !== "admin") {
    window.location.href = "panel.html";
}

/* 2. INICIALIZACIÓN DE LA VISTA */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#userName").forEach(el => el.textContent = usuario.nombre || "Administrador");
    document.querySelectorAll("#userRole").forEach(el => el.textContent = "Admin");

    const selectRol = document.getElementById("selectRolVista");
    if (selectRol) selectRol.value = "administrador";

    cargarDatosDashboardAdmin();
    inicializarEventosAdmin();
    navegarAdmin("dashboard");
});

/* 3. NAVEGACIÓN INTERNA DEL ADMIN */
function navegarAdmin(seccion) {
    document.querySelectorAll(".seccion-admin").forEach(sec => sec.classList.add("oculto"));
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));

    const seccionActiva = document.getElementById(`sec-${seccion}`);
    if (seccionActiva) seccionActiva.classList.remove("oculto");

    const menuActivo = document.getElementById(`menu-${seccion}`);
    if (menuActivo) menuActivo.classList.add("active");
}
window.navegarAdmin = navegarAdmin;

/* 4. CONSULTAS Y RENDERS DE ADMINISTRACIÓN */
async function cargarDatosDashboardAdmin() {
    try {
        // A) Clientes
        const qClientes = query(collection(db, "Usuarios"), where("rol_usuario", "==", "cliente"));
        const snapClientes = await getDocs(qClientes);

        const countClientesEl = document.getElementById("countClientes");
        if (countClientesEl) countClientesEl.textContent = snapClientes.size;

        let htmlClientes = `<table class="data-table">
            <thead><tr><th>Nombre</th><th>Correo</th></tr></thead><tbody>`;
        snapClientes.forEach((docSnap) => {
            const c = docSnap.data();
            htmlClientes += `<tr><td>${c.nombre || '-'}</td><td>${c.correo || '-'}</td></tr>`;
        });
        htmlClientes += `</tbody></table>`;
        
        const contenedorClientes = document.getElementById("contenedorClientes");
        if (contenedorClientes) {
            contenedorClientes.innerHTML = snapClientes.empty ? "<p>No hay clientes registrados.</p>" : htmlClientes;
        }

        // B) Técnicos y Administradores
        const snapUsuarios = await getDocs(collection(db, "Usuarios"));
        let countTecnicos = 0;
        let htmlTecnicos = `<table class="data-table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead><tbody>`;
        
        snapUsuarios.forEach((docSnap) => {
            const u = docSnap.data();
            const uRol = (u.rol_usuario || "").toLowerCase();
            if (uRol === "tecnico" || uRol === "administrador" || uRol === "admin") {
                countTecnicos++;
                htmlTecnicos += `<tr><td>${u.nombre || '-'}</td><td>${u.correo || '-'}</td><td style="text-transform:capitalize;">${u.rol_usuario}</td></tr>`;
            }
        });
        htmlTecnicos += `</tbody></table>`;

        const countTecnicosEl = document.getElementById("countTecnicos");
        if (countTecnicosEl) countTecnicosEl.textContent = countTecnicos;
        
        const contenedorTecnicos = document.getElementById("contenedorTecnicos");
        if (contenedorTecnicos) {
            contenedorTecnicos.innerHTML = countTecnicos === 0 ? "<p>No hay personal registrado.</p>" : htmlTecnicos;
        }

        // C) Planes
        const snapPlanes = await getDocs(collection(db, "Planes"));
        const countPlanesEl = document.getElementById("countPlanes");
        if (countPlanesEl) countPlanesEl.textContent = snapPlanes.size;
        renderizarPlanes(snapPlanes);

        // D) Solicitudes y Averías
        const snapSolicitudes = await getDocs(collection(db, "Solicitudes"));
        const averias = [];
        snapSolicitudes.forEach((docSnap) => {
            const s = docSnap.data();
            if (!s.tipo || s.tipo.toLowerCase().includes("avería") || s.tipo.toLowerCase().includes("averia")) {
                averias.push({ id: docSnap.id, ...s });
            }
        });

        const pendientes = averias.filter(a => (a.estado || "Pendiente") !== "Resuelto").length;
        const countAveriasEl = document.getElementById("countAverias");
        if (countAveriasEl) countAveriasEl.textContent = pendientes;

        renderizarAverias(averias);

    } catch (error) {
        console.error("Error al cargar datos de administración:", error);
    }
}

function renderizarAverias(averias) {
    const tablaResumen = document.getElementById("tablaResumenAverias");
    const tablaCompleta = document.getElementById("tablaAveriasCompleta");

    if (averias.length === 0) {
        if (tablaResumen) tablaResumen.innerHTML = `<tr><td colspan="4" class="text-center">No hay averías registradas.</td></tr>`;
        if (tablaCompleta) tablaCompleta.innerHTML = `<tr><td colspan="7" class="text-center">No hay averías registradas.</td></tr>`;
        return;
    }

    let filasResumen = "";
    let filasCompletas = "";

    averias.slice(0, 5).forEach((a) => {
        filasResumen += `<tr>
            <td>${a.cliente || "Anónimo"}</td>
            <td>${a.detalle || "-"}</td>
            <td>${a.estado || "Pendiente"}</td>
            <td>
                <select onchange="cambiarEstadoAveria('${a.id}', this.value)">
                    <option value="">Cambiar...</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelto">Resuelto</option>
                </select>
            </td>
        </tr>`;
    });

    averias.forEach((a) => {
        const fecha = a.fecha ? new Date(a.fecha).toLocaleDateString() : "-";
        filasCompletas += `<tr>
            <td>${a.id.slice(0, 6)}</td>
            <td>${a.cliente || "Anónimo"}</td>
            <td>${a.detalle || "-"}</td>
            <td>${fecha}</td>
            <td>${a.estado || "Pendiente"}</td>
            <td>${a.tecnicoAsignado || "Sin asignar"}</td>
            <td>
                <select onchange="cambiarEstadoAveria('${a.id}', this.value)">
                    <option value="">Cambiar...</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelto">Resuelto</option>
                </select>
            </td>
        </tr>`;
    });

    if (tablaResumen) tablaResumen.innerHTML = filasResumen;
    if (tablaCompleta) tablaCompleta.innerHTML = filasCompletas;
}

async function cambiarEstadoAveria(id, nuevoEstado) {
    if (!nuevoEstado) return;
    try {
        await updateDoc(doc(db, "Solicitudes", id), { estado: nuevoEstado });
        cargarDatosDashboardAdmin();
    } catch (err) {
        console.error("Error al cambiar estado:", err);
        alert("Ocurrió un error al actualizar el estado.");
    }
}
window.cambiarEstadoAveria = cambiarEstadoAveria;

function renderizarPlanes(snapPlanes) {
    const cont = document.getElementById("contenedorPlanes");
    if (!cont) return;

    if (snapPlanes.empty) {
        cont.innerHTML = `<p>No hay planes registrados en el sistema.</p>`;
        return;
    }

    let html = "";
    snapPlanes.forEach((docSnap) => {
        const p = docSnap.data();
        html += `
            <div class="card-plan">
                <h3>${p.nombre}</h3>
                <p><strong>Velocidad:</strong> ${p.velocidad}</p>
                <p><strong>Precio:</strong> $${p.precio} / mes</p>
            </div>`;
    });
    cont.innerHTML = html;
}

/* 5. REGISTROS (FORMULARIOS) */
function inicializarEventosAdmin() {
    const formTecnico = document.getElementById("formRegistroTecnico");
    if (formTecnico) {
        formTecnico.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("msgTecnico");

            const nombre = document.getElementById("tecNombre").value.trim();
            const correo = document.getElementById("tecCorreo").value.trim().toLowerCase();
            const telefono = document.getElementById("tecTelefono").value.trim();
            const password = document.getElementById("tecPassword").value;
            const rolSelect = document.getElementById("tecRol") ? document.getElementById("tecRol").value : "tecnico";

            try {
                await addDoc(collection(db, "Usuarios"), {
                    nombre,
                    correo,
                    telefono,
                    contraseña: password,
                    rol_usuario: rolSelect
                });

                if (msg) msg.innerHTML = `<span style="color:green; font-weight:bold;">Usuario registrado correctamente como ${rolSelect}.</span>`;
                formTecnico.reset();
                cargarDatosDashboardAdmin();
            } catch (err) {
                console.error(err);
                if (msg) msg.innerHTML = `<span style="color:red;">Error al registrar el usuario.</span>`;
            }
        });
    }

    const formPlan = document.getElementById("formCrearPlan");
    if (formPlan) {
        formPlan.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("msgPlan");

            const nombre = document.getElementById("planNombre").value.trim();
            const velocidad = document.getElementById("planVelocidad").value.trim();
            const precio = document.getElementById("planPrecio").value;

            try {
                await addDoc(collection(db, "Planes"), { nombre, velocidad, precio });

                if (msg) msg.innerHTML = `<span style="color:green; font-weight:bold;">Plan guardado con éxito.</span>`;
                formPlan.reset();
                cargarDatosDashboardAdmin();
            } catch (err) {
                console.error(err);
                if (msg) msg.innerHTML = `<span style="color:red;">Error al guardar el plan.</span>`;
            }
        });
    }
}