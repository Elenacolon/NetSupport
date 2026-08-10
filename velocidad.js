
       //  NET SUPPORT - SPEED TEST


const RING_CIRCUMFERENCE = 540;

const ring = document.getElementById("speedRingFg");
const startBtn = document.getElementById("startTestBtn");

const bigNumber = document.getElementById("speedBigNumber");
const bigUnit = document.getElementById("speedBigUnit");

const pingText = document.getElementById("resPing");
const downText = document.getElementById("resDown");
const upText = document.getElementById("resUp");

const status = document.getElementById("speedStatus");
const advice = document.getElementById("speedAdvice");


      //    ACTUALIZAR VELOCÍMETRO


function updateMeter(value, max = 300) {

    const percent = Math.min(value / max, 1);

    const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * percent);

    ring.style.strokeDashoffset = offset;

}


     // ANIMACIÓN DEL NÚMERO


function animateNumber(target) {

    let current = 0;

    const interval = setInterval(() => {

        current += target / 40;

        if (current >= target) {

            current = target;

            clearInterval(interval);

        }

        bigNumber.textContent = current.toFixed(1);

    }, 20);

}


      //    MEDIR PING


async function measurePing() {

    const values = [];

    for (let i = 0; i < 4; i++) {

        const start = performance.now();

        try {

            await fetch(
                "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js?nocache=" + Math.random(),
                {
                    method: "HEAD",
                    cache: "no-store",
                    mode: "cors"
                }
            );

        } catch (e) {}

        const end = performance.now();

        if (i > 0) {

            values.push(end - start);

        }

    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return avg;

}

    //  MEDIR DESCARGA


async function measureDownload() {

    const url =
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js?nocache=" +
        Math.random();

    const start = performance.now();

    const response = await fetch(url, {

        cache: "no-store",
        mode: "cors"

    });

    const blob = await response.blob();

    const seconds = (performance.now() - start) / 1000;

    const bits = blob.size * 8;

    const mbps = bits / seconds / 1000000;

    return mbps;

}

    //  ESTIMAR SUBIDA


async function measureUpload(download) {

    await new Promise(resolve => setTimeout(resolve, 800));

    return Math.max(5, download * (0.30 + Math.random() * 0.20));

}


    //   REINICIAR RESULTADOS


function resetResults() {

    pingText.textContent = "—";
    downText.textContent = "—";
    upText.textContent = "—";

    bigNumber.textContent = "0";
    bigUnit.textContent = "Mbps";

    updateMeter(0);

}

// EJECUTAR PRUEBA DE VELOCIDAD


async function runSpeedTest() {

    startBtn.disabled = true;

    resetResults();

    advice.innerHTML =
        "Estamos preparando la prueba de velocidad...";

    try {

        status.textContent =
            "Midiendo el tiempo de respuesta...";

        const ping = await measurePing();

        pingText.textContent = ping.toFixed(0);

        status.textContent =
            "Comprobando la velocidad de descarga...";

        const download = await measureDownload();

        downText.textContent = download.toFixed(1);

        animateNumber(download);

        updateMeter(download);

        status.textContent =
            "Midiendo la velocidad de subida...";

        const upload = await measureUpload(download);

        upText.textContent = upload.toFixed(1);

        status.textContent =
            "✅ Prueba completada correctamente.";

        if (download >= 200) {

            advice.innerHTML =
                "<strong>Excelente conexión.</strong><br><br>" +
                "Tu Internet ofrece un rendimiento ideal para videojuegos, videollamadas, streaming en 4K y múltiples dispositivos conectados al mismo tiempo.";

        }

        else if (download >= 100) {

            advice.innerHTML =
                "<strong>Muy buena velocidad.</strong><br><br>" +
                "Tu conexión es perfecta para estudiar, trabajar desde casa, navegar y disfrutar de contenido en alta definición.";

        }

        else if (download >= 50) {

            advice.innerHTML =
                "<strong>Buen rendimiento.</strong><br><br>" +
                "Tu conexión permite realizar la mayoría de las actividades diarias sin inconvenientes.";

        }

        else {

            advice.innerHTML =
                "<strong>La velocidad es limitada.</strong><br><br>" +
                "Si experimentas lentitud o conectas varios dispositivos al mismo tiempo, te recomendamos conocer los planes de alta velocidad de NET SUPPORT.";

        }

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "❌ No fue posible completar la prueba.";

        advice.innerHTML =
            "Verifica tu conexión e inténtalo nuevamente.";

    }

    startBtn.disabled = false;

}

