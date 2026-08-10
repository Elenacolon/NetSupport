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

/*   CERRAR SESIÓN GLOBAL*/
function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

/*  1. VERIFICACIÓN DE SESIÓN Y ROL */
const usuarioGuardado = sessionStorage.getItem("usuario");

if (!usuarioGuardado) {
    window.location.href = "login.html";
}

const usuario = JSON.parse(usuarioGuardado);
const rol = (usuario.rol_usuario || "").toLowerCase();

/*  2. INICIALIZACIÓN SEGÚN EL ROL */

document.addEventListener("DOMContentLoaded", () => {
    const adminPanel = document.getElementById("adminPanel");
    const tecnicoPanel = document.getElementById("tecnicoPanel");
    const clientePanel = document.getElementById("clientePanel");
    const nombreClienteEl = document.getElementById("nombreCliente");

    // Ocultar todos por seguridad inicialmente
    if (adminPanel) adminPanel.classList.add("oculto");
    if (tecnicoPanel) tecnicoPanel.classList.add("oculto");
    if (clientePanel) clientePanel.classList.add("oculto");

    if (rol === "administrador" || rol === "admin") {
        if (adminPanel) adminPanel.classList.remove("oculto");
        cargarDatosDashboardAdmin();
        inicializarEventosAdmin();
        mostrar('dashboard');

    } else if (rol === "tecnico") {
        if (tecnicoPanel) tecnicoPanel.classList.remove("oculto");
        mostrarTecnico('averias');

    } else {
        // Rol Cliente por defecto
        if (clientePanel) clientePanel.classList.remove("oculto");
        if (nombreClienteEl) nombreClienteEl.textContent = usuario.nombre || "Cliente";
        mostrarCliente('inicio');
    }
});

/* 3. FUNCIONES DEL ADMINISTRADOR */
function mostrar(seccionId) {
    const secciones = document.querySelectorAll("#adminPanel .seccion");
    secciones.forEach(sec => sec.classList.add("oculto"));

    const itemsMenu = document.querySelectorAll("#adminPanel .sidebar li");
    itemsMenu.forEach(item => item.classList.remove("active"));

    const seccionActiva = document.getElementById(seccionId);
    if (seccionActiva) seccionActiva.classList.remove("oculto");

    const menuActivo = document.getElementById(`menu-${seccionId}`);
    if (menuActivo) menuActivo.classList.add("active");

    const titulo = document.getElementById("titulo");
    if (titulo) titulo.textContent = seccionId.toUpperCase();
}
window.mostrar = mostrar;

async function cargarDatosDashboardAdmin() {
    try {
        // A) Clientes
        const qClientes = query(collection(db, "Usuarios"), where("rol_usuario", "==", "cliente"));
        const snapClientes = await getDocs(qClientes);
        document.getElementById("countClientes").textContent = snapClientes.size;

        const listaClientesRecientes = document.getElementById("listaClientesRecientes");
        const contenedorClientes = document.getElementById("contenedorClientes");

        if (listaClientesRecientes) listaClientesRecientes.innerHTML = "";
        let htmlClientes = `<table style="width:100%; text-align:left; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid #ddd; padding:8px;"><th>Nombre</th><th>Correo</th></tr></thead><tbody>`;

        snapClientes.forEach((docSnap) => {
            const data = docSnap.data();
            if (listaClientesRecientes) {
                listaClientesRecientes.innerHTML += `
                    <li style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <i class='bx bx-user' style="font-size:20px;"></i>
                        <div><strong>${data.nombre}</strong><br><small style="color:#666;">${data.correo}</small></div>
                    </li>`;
            }
            htmlClientes += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${data.nombre}</td><td style="padding:10px;">${data.correo}</td></tr>`;
        });
        if (contenedorClientes) contenedorClientes.innerHTML = htmlClientes + `</tbody></table>`;

        // B) Personal (Técnicos + Admins)
        const snapUsuarios = await getDocs(collection(db, "Usuarios"));
        let countPersonal = 0;
        let htmlTecnicos = `<table style="width:100%; text-align:left; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid #ddd;"><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead><tbody>`;

        snapUsuarios.forEach((docSnap) => {
            const u = docSnap.data();
            const uRol = (u.rol_usuario || "").toLowerCase();
            if (uRol === "tecnico" || uRol === "administrador" || uRol === "admin") {
                countPersonal++;
                htmlTecnicos += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${u.nombre}</td><td style="padding:10px;">${u.correo}</td><td style="padding:10px;"><b style="color:#6c5ce7; text-transform:capitalize;">${u.rol_usuario}</b></td></tr>`;
            }
        });
        document.getElementById("countTecnicos").textContent = countPersonal;
        document.getElementById("contenedorTecnicos").innerHTML = htmlTecnicos + `</tbody></table>`;

        // C) Planes
        const snapPlanes = await getDocs(collection(db, "Planes"));
        document.getElementById("countPlanes").textContent = snapPlanes.size;
        renderizarPlanesAdmin(snapPlanes);

        // D) Solicitudes y Averías
        const snapSolicitudes = await getDocs(collection(db, "Solicitudes"));
        document.getElementById("countSolicitudes").textContent = snapSolicitudes.size;

        const tablaResumen = document.getElementById("tablaResumenSolicitudes");
        const contenedorSolicitudesAdmin = document.getElementById("contenedorSolicitudesAdmin");

        if (tablaResumen) tablaResumen.innerHTML = "";
        let htmlSol = `<table style="width:100%; text-align:left; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid #ddd;"><th>Cliente</th><th>Tipo</th><th>Detalle</th><th>Estado</th><th>Acción</th></tr></thead><tbody>`;

        if (snapSolicitudes.empty) {
            if (tablaResumen) tablaResumen.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px;">No hay solicitudes registradas.</td></tr>`;
            if (contenedorSolicitudesAdmin) contenedorSolicitudesAdmin.innerHTML = `<p style="padding:15px;">No hay averías o solicitudes pendientes.</p>`;
        } else {
            snapSolicitudes.forEach((docSnap) => {
                const s = docSnap.data();
                const id = docSnap.id;
                const filaResumen = `<tr>
                    <td style="padding:8px;">${s.cliente || 'Anónimo'}</td>
                    <td style="padding:8px;">${s.tipo || 'General'}</td>
                    <td style="padding:8px;">${s.detalle || '-'}</td>
                    <td style="padding:8px;"><span style="background:#ffeaa7; color:#d63031; padding:3px 8px; border-radius:5px; font-weight:bold;">${s.estado || 'Pendiente'}</span></td>
                </tr>`;
                
                const filaAdmin = `<tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${s.cliente || 'Anónimo'}</td>
                    <td style="padding:10px;">${s.tipo || 'General'}</td>
                    <td style="padding:10px;">${s.detalle || '-'}</td>
                    <td style="padding:10px;"><b style="color:#d63031;">${s.estado || 'Pendiente'}</b></td>
                    <td style="padding:10px;">
                        <select onchange="cambiarEstadoSolicitud('${id}', this.value)" style="padding:5px; border-radius:5px; border:1px solid #ccc;">
                            <option value="">Cambiar estado...</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Resuelto">Resuelto</option>
                        </select>
                    </td>
                </tr>`;

                if (tablaResumen) tablaResumen.innerHTML += filaResumen;
                htmlSol += filaAdmin;
            });
            if (contenedorSolicitudesAdmin) contenedorSolicitudesAdmin.innerHTML = htmlSol + `</tbody></table>`;
        }

    } catch (error) {
        console.error("Error al cargar datos de administración:", error);
    }
}

async function cambiarEstadoSolicitud(idSolicitud, nuevoEstado) {
    if (!nuevoEstado) return;
    try {
        const refDoc = doc(db, "Solicitudes", idSolicitud);
        await updateDoc(refDoc, { estado: nuevoEstado });
        alert(`Estado actualizado a: ${nuevoEstado}`);
        cargarDatosDashboardAdmin();
    } catch (err) {
        console.error("Error al cambiar estado:", err);
        alert("Ocurrió un error al actualizar el estado.");
    }
}
window.cambiarEstadoSolicitud = cambiarEstadoSolicitud;

function renderizarPlanesAdmin(snapPlanes) {
    const cont = document.getElementById("contenedorPlanesAdmin");
    if (!cont) return;

    if (snapPlanes.empty) {
        cont.innerHTML = `<p>No hay planes registrados en el sistema.</p>`;
        return;
    }

    let html = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:15px;">`;
    snapPlanes.forEach((docSnap) => {
        const p = docSnap.data();
        html += `
            <div style="border:1px solid #eee; padding:15px; border-radius:10px; background:#f9f9f9;">
                <h3 style="color:#6c5ce7; margin-bottom:5px;">${p.nombre}</h3>
                <p style="margin:3px 0;"><strong>Velocidad:</strong> ${p.velocidad}</p>
                <p style="margin:3px 0;"><strong>Precio:</strong> $${p.precio} / mes</p>
            </div>`;
    });
    html += `</div>`;
    cont.innerHTML = html;
}

function inicializarEventosAdmin() {
    // Formulario Registrar Técnico / Admin
    const formPersonal = document.getElementById("formRegistroPersonal");
    if (formPersonal) {
        formPersonal.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("msgPersonal");
            
            const nombre = document.getElementById("pNombre").value.trim();
            const correo = document.getElementById("pCorreo").value.trim().toLowerCase();
            const password = document.getElementById("pPassword").value;
            const rolSel = document.getElementById("pRol").value;

            try {
                await addDoc(collection(db, "Usuarios"), {
                    nombre: nombre,
                    correo: correo,
                    contraseña: password,
                    rol_usuario: rolSel
                });

                msg.innerHTML = `<span style="color:green; font-weight:bold;">Usuario registrado como ${rolSel} correctamente.</span>`;
                formPersonal.reset();
                cargarDatosDashboardAdmin();
            } catch (err) {
                console.error(err);
                msg.innerHTML = `<span style="color:red;">Error al guardar el usuario.</span>`;
            }
        });
    }

    // Formulario Crear Plan
    const formPlan = document.getElementById("formCrearPlan");
    if (formPlan) {
        formPlan.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("msgPlan");

            const nombre = document.getElementById("planNombre").value.trim();
            const velocidad = document.getElementById("planVelocidad").value.trim();
            const precio = document.getElementById("planPrecio").value;

            try {
                await addDoc(collection(db, "Planes"), {
                    nombre: nombre,
                    velocidad: velocidad,
                    precio: precio
                });

                msg.innerHTML = `<span style="color:green; font-weight:bold;">Plan guardado con éxito.</span>`;
                formPlan.reset();
                cargarDatosDashboardAdmin();
            } catch (err) {
                console.error(err);
                msg.innerHTML = `<span style="color:red;">Error al guardar el plan.</span>`;
            }
        });
    }
}

/*  4. FUNCIONES DEL TÉCNICO */
async function mostrarTecnico(seccion) {
    const itemsMenu = document.querySelectorAll("#tecnicoPanel .sidebar li");
    itemsMenu.forEach(item => item.classList.remove("active"));

    const menuActivo = document.getElementById(`tmenu-${seccion}`);
    if (menuActivo) menuActivo.classList.add("active");

    const contenedor = document.getElementById("tecnicoContenido");
    if (!contenedor) return;

    if (seccion === 'averias') {
        contenedor.innerHTML = `<div class="main-card"><h2>Averías y Reportes de Clientes</h2><div id="listaAveriasTecnico">Cargando...</div></div>`;
        cargarAveriasTecnico();
    } else if (seccion === 'planes') {
        contenedor.innerHTML = `<div class="main-card"><h2>Catálogo de Planes de Red</h2><div id="listaPlanesTecnico">Cargando...</div></div>`;
        cargarPlanesVistaGeneral("listaPlanesTecnico");
    }
}
window.mostrarTecnico = mostrarTecnico;

async function cargarAveriasTecnico() {
    const cont = document.getElementById("listaAveriasTecnico");
    try {
        const snap = await getDocs(collection(db, "Solicitudes"));
        if (snap.empty) {
            cont.innerHTML = `<p style="margin-top:10px;">No hay reportes de averías pendientes.</p>`;
            return;
        }

        let html = `<table style="width:100%; text-align:left; margin-top:15px; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid #ddd;"><th>Cliente</th><th>Correo</th><th>Detalle</th><th>Estado</th></tr></thead><tbody>`;
        
        snap.forEach((docSnap) => {
            const d = docSnap.data();
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${d.cliente}</td>
                <td style="padding:10px;">${d.correo}</td>
                <td style="padding:10px;">${d.detalle}</td>
                <td style="padding:10px;"><b style="color:#d63031;">${d.estado || 'Pendiente'}</b></td>
            </tr>`;
        });
        cont.innerHTML = html + `</tbody></table>`;
    } catch (err) {
        console.error(err);
    }
}

/* 5. FUNCIONES DE CLIENTE */
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
        cargarPlanesVistaGeneral("listaPlanesCliente");

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

async function cargarPlanesVistaGeneral(idContenedor) {
    const cont = document.getElementById(idContenedor);
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