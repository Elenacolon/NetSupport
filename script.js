// ==========================
// CONTROL DEL MODAL & MENÚ
// ==========================

function abrirModal(plan, velocidad, precio) {
    const titulo = document.getElementById("tituloPlan");
    const vel = document.getElementById("velocidadPlan");
    const inputPlan = document.getElementById("plan");
    const inputPrecio = document.getElementById("precio");
    const modal = document.getElementById("modal");

    if (titulo) titulo.innerHTML = plan;
    if (vel) vel.innerHTML = `${velocidad} - ${precio}`;
    if (inputPlan) inputPlan.value = plan;
    if (inputPrecio) inputPrecio.value = precio;
    if (modal) modal.style.display = "flex";
}

function cerrarModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

function abrirMenu() {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.toggle("activo");
}

function abrirChatbot() {
    const chatbot = document.getElementById("chatbot");
    if (chatbot) chatbot.style.display = "block";
}

function cerrarChat() {
    const chatbot = document.getElementById("chatbot");
    if (chatbot) chatbot.style.display = "none";
}

// Hacer globales las funciones necesarias para HTML (onclick)
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.abrirMenu = abrirMenu;
window.abrirChatbot = abrirChatbot;
window.cerrarChat = cerrarChat;



async function enviarSolicitud(nombre, email, plan, precio) {
    const fecha = new Date().toLocaleDateString("es-DO");

    // Enviamos tanto 'email' como 'correo' para prevenir conflictos en EmailJS
    const parametros = {
        nombre: nombre,
        email: email,
        correo: email,
        plan: plan,
        precio: precio,
        fecha: fecha
    };

    try {
        await emailjs.send("service_y4k9d8m", "template_gnmuza7", parametros);
        alert("🎉 ¡Plan solicitado exitosamente!\n\nRevisa tu correo para confirmar los detalles.");
        cerrarModal();
    } catch (error) {
        console.error("❌ Error al enviar con EmailJS:", error);
        alert("Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.");
    }
}

// Event listener para capturar el envío del formulario
const formulario = document.getElementById("formulario");
if (formulario) {
    formulario.addEventListener("submit", async function(e) {
        e.preventDefault();

        const btn = formulario.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const plan = document.getElementById("plan").value;
        const precio = document.getElementById("precio").value;

        await enviarSolicitud(nombre, email, plan, precio);

        if (btn) btn.disabled = false;
        formulario.reset();
    });
}
