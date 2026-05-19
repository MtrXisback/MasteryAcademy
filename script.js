const terminal = document.getElementById('terminal-output');
const launchBtn = document.getElementById('launch-btn');
const rocket = document.getElementById('rocket');
const gpuBar = document.getElementById('gpu-bar');
const gpuPercent = document.getElementById('gpu-percent');

const metrics = {
    alt: document.getElementById('alt-val'),
    vel: document.getElementById('vel-val'),
    lat: document.getElementById('lat-val'),
    status: document.getElementById('status-val')
};

const commands = [
    { cmd: "aws configure get region", out: "Region: us-east-1", status: "info" },
    { cmd: "aws sagemaker list-endpoints", out: "No hay endpoints activos encontrados.", status: "info" },
    { cmd: "aws sagemaker create-model --model-name llama-405b-v1 ...", out: "Modelo registrado en el registro de modelos de AWS.", status: "success" },
    { cmd: "aws sagemaker create-endpoint-config --config-name llama-config-h100-8x", out: "Configuración de endpoint creada: p5.48xlarge (8x H100)", status: "success" },
    { cmd: "aws sagemaker create-endpoint --endpoint-name llama-3-1-405b-prod", out: "Creando endpoint... (Esto puede tomar unos minutos)", status: "warning" },
    { cmd: "watch -n 1 'nvidia-smi'", out: "Detectando 8 unidades H100 80GB SXM5. Conectando NVLink...", status: "info" }
];

let isLaunching = false;

function addTerminalLine(text, type = 'cmd') {
    const line = document.createElement('div');
    line.className = `terminal-line status-${type}`;
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

async function runSimulation() {
    if (isLaunching) return;
    isLaunching = true;
    launchBtn.disabled = true;
    
    // Command execution simulation
    for (const item of commands) {
        addTerminalLine(`$ ${item.cmd}`, 'cmd');
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        addTerminalLine(item.out, item.status);
        
        // Update GPU Bar slightly per command
        const currentGpu = parseInt(gpuPercent.textContent);
        updateGpu(currentGpu + 15);
    }

    addTerminalLine("SISTEMA LISTO. INICIANDO SECUENCIA DE DESPEGUE.", "success");
    metrics.status.textContent = "IGNITION";
    metrics.status.style.color = "#f59e0b";
    
    // Countdown
    for (let i = 5; i > 0; i--) {
        addTerminalLine(`T-MINUS ${i}...`, 'warning');
        await new Promise(r => setTimeout(r, 1000));
    }

    // Launch!
    launch();
}

function launch() {
    rocket.classList.add('shaking');
    addTerminalLine("LIFTOFF! Llama 3.1 405B está en órbita.", "success");
    metrics.status.textContent = "ORBITAL";
    metrics.status.style.color = "#10b981";
    
    let altitude = 0;
    let velocity = 0;
    let gpu = 90;

    const interval = setInterval(() => {
        altitude += 1.2;
        velocity += 240;
        gpu = 90 + Math.random() * 8; // Heavy load
        
        metrics.alt.textContent = `${altitude.toFixed(1)} km`;
        metrics.vel.textContent = `${Math.floor(velocity)} km/h`;
        metrics.lat.textContent = `${Math.floor(20 + Math.random() * 15)} ms`;
        updateGpu(gpu);

        // Rocket visual effect
        const yTranslate = Math.max(-500, -altitude * 5);
        rocket.style.transform = `translateY(${yTranslate}px) scale(${1 - altitude/1000})`;

        if (altitude > 100) {
            addTerminalLine("Máxima presión dinámica superada. Motores a plena potencia.", "info");
        }
        
        if (altitude > 500) {
            clearInterval(interval);
            addTerminalLine("Inferencia estabilizada. 405B disponible para consultas.", "success");
            launchBtn.textContent = "SISTEMA OPERATIVO";
            rocket.classList.remove('shaking');
        }
    }, 100);
}

function updateGpu(percent) {
    const val = Math.min(100, Math.max(0, percent));
    gpuBar.style.width = `${val}%`;
    gpuPercent.textContent = `${Math.floor(val)}%`;
}

// Background stars
function createStars() {
    const container = document.getElementById('stars-container');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.background = '#fff';
        star.style.borderRadius = '50%';
        star.style.opacity = Math.random();
        container.appendChild(star);
    }
}

launchBtn.addEventListener('click', runSimulation);
createStars();
