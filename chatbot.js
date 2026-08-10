
//Chatbot

function enviarPregunta() {

    let input = document.getElementById("pregunta");
    let mensaje = input.value.trim();

    if (mensaje === "") return;

    let chat = document.getElementById("chat-body");

    // Mostrar mensaje del usuario
    chat.innerHTML += `<div class="user">${mensaje}</div>`;

    let texto = mensaje.toLowerCase();
    let respuesta = "";

    // PLANES
    if (texto.includes("plan") || texto.includes("planes")) {
        respuesta = `
        Estos son nuestros planes de Internet:
        <br><br>
        📶 20 Mbps - RD$995.99/mes
        <br>
        📶 50 Mbps - RD$1,995.99/mes
        <br>
        📶 100 Mbps - RD$2,995.99/mes
        <br>
        📶 200 Mbps - RD$3,795.99/mes
        <br>
        📶 500 Mbps - RD$4,495.99/mes
        <br>
        📶 1000 Mbps - RD$6,995.99/mes
        <br>
        ¿Deseas contratar alguno?`;
    }

    // PRECIOS
    else if (texto.includes("precio") || texto.includes("cuánto cuesta") || texto.includes("costo")) {
        respuesta = `
        Nuestros precios comienzan desde <b>RD$995</b> al mes.
        <br><br>
        Tenemos planes para hogares y empresas.`;
    }

    // COBERTURA
    else if (texto.includes("cobertura") || texto.includes("disponibilidad")) {
        respuesta = `
        Para verificar la cobertura necesitamos tu provincia o dirección.
        <br><br>
        Escríbela y con gusto te ayudaremos.`;
    }

    // PAGO
    else if (
        texto.includes("pagar") ||
        texto.includes("factura") ||
        texto.includes("pago")
    ) {
        respuesta = `
        Puedes pagar tu factura mediante:
        <br><br>
        💳 Tarjeta de crédito o débito.
        <br>
        🏦 Transferencia bancaria.
        <br>
        💵 En nuestras oficinas autorizadas.`;
    }

    // FIBRA
    else if (
        texto.includes("fibra") ||
        texto.includes("cable")
    ) {
        respuesta = `
        La fibra óptica ofrece:
        <br><br>
        ✅ Mayor velocidad.
        <br>
        ✅ Conexión más estable.
        <br>
        ✅ Menor latencia.
        <br><br>
        El cable coaxial suele ser más económico, pero puede perder rendimiento cuando hay muchos usuarios conectados.`;
    }

    // INTERNET LENTO
    else if (
        texto.includes("internet lento") ||
        texto.includes("internet está lento") ||
        texto.includes("muy lento") ||
        texto.includes("lento")
    ) {
        respuesta = `
        Puedes intentar lo siguiente:
        <br><br>
        1️⃣ Reinicia el módem durante 30 segundos.
        <br>
        2️⃣ Comprueba que los cables estén bien conectados.
        <br>
        3️⃣ Acércate al router si utilizas Wi-Fi.
        <br>
        4️⃣ Si el problema continúa, comunícate con soporte técnico.`;
    }

    // SALUDO
    else if (
        texto.includes("hola") ||
        texto.includes("buenas") ||
        texto.includes("buenos días") ||
        texto.includes("buenas tardes")
    ) {
        respuesta = "¡Hola! 👋 Bienvenido a NET SUPPORT. ¿En qué puedo ayudarte?";
    }

    // DESPEDIDA
    else if (
        texto.includes("gracias") ||
        texto.includes("adiós") ||
        texto.includes("hasta luego")
    ) {
        respuesta = "¡Gracias por comunicarte con nosotros! 😊";
    }

    // RESPUESTA POR DEFECTO
    else {
        respuesta = `
        Lo siento, no entendí tu pregunta.
        <br><br>
        Puedes preguntarme sobre:
        <br>
        • Planes de Internet
        <br>
        • Precios
        <br>
        • Cobertura
        <br>
        • Pago de facturas
        <br>
        • Fibra óptica
        <br>
        • Soporte técnico`;
    }

    // Simular que el bot está escribiendo
    setTimeout(() => {
        chat.innerHTML += `<div class="bot">${respuesta}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }, 800);

    input.value = "";

}

function abrirMenu(){
    document.getElementById("menu").classList.toggle("activo");
}

function abrirChatbot(){
    document.getElementById("chatbot").style.display="block";
}

function cerrarChat(){
    document.getElementById("chatbot").style.display="none";
}

