// Navigation for About, Contact, etc.
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    function showSection(id) {
        sections.forEach(section => {
            if (section.id === id) {
                section.classList.remove('hidden-section');
                section.classList.add('section-fade-in');
            } else {
                section.classList.add('hidden-section');
            }
        });
    }

    function updateActiveLink(id) {
        links.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active-link');
            } else {
                link.classList.remove('active-link');
            }
        });
    }
    
    // Initial setup
    const initialHash = window.location.hash ? window.location.hash.substring(1) : 'home';
    showSection(initialHash);
    updateActiveLink(initialHash);

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            window.location.hash = targetId;
            showSection(targetId);
            updateActiveLink(targetId);
        });
    });
});


// --- The Game Logic ---
window.addEventListener('DOMContentLoaded', () => {
    // --- Canvas and DOM Elements ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const introModal = document.getElementById('introModal');
    const startButton = document.getElementById('startButton');
    const loadingTitle = document.getElementById('loadingTitle');
    const infoModal = document.getElementById('infoModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const interactionPrompt = document.getElementById('interactionPrompt');
    const terminalModal = document.getElementById('terminalModal');
    const closeTerminalButton = document.getElementById('closeTerminalButton');
    const terminalOutput = document.getElementById('terminalOutput');
    const catContainer = document.getElementById('cat-container');
    const transitionOverlay = document.getElementById('transitionOverlay');

    // --- Game State Variables ---
    const TILE_SIZE = 16;
    const playerSpeed = 2;

    let player = { x: TILE_SIZE * 5, y: TILE_SIZE * 5, width: TILE_SIZE * 0.8, height: TILE_SIZE, isMoving: false, animationFrame: 0, frameCounter: 0, frameDelay: 10 };
    let keys = {};
    let currentInteractiveObject = null;
    let gameRunning = false;
    let currentScene = 0;
    let currentPlayingSound = null;
    
    // --- Three.js Variables ---
    let threeScene, threeCamera, threeRenderer, catModel, catAnimationId;

    // --- Scene and Asset Definitions ---
    const sprites = {};
    const sounds = {};
    
    const spriteSources = { player: 'assets/player.png', desk: 'assets/desk.png', arcade: 'assets/arcade.png', bookshelf: 'assets/bookshelf.png', table: 'assets/table.png', cabinet: 'assets/cabinet.png', floor: 'assets/floor.png', wall: 'assets/wall.png', door: 'assets/door.png', egg1: 'assets/egg1.png' };
    const soundSources = { uiiiai_cat: 'assets/uiiiai_cat.mp3', rickroll: 'assets/rickroll.mp3' };

    const scenes = [
        // Scene 0: The Office
        {
            map: [ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1], ],
            objects: [
                { type: 'project', name: 'desk', x: TILE_SIZE * 2, y: TILE_SIZE * 2, width: TILE_SIZE * 2, height: TILE_SIZE, content: { title: 'AegisGRID', type: 'Desktop Application', fields: ['Cybersecurity', 'AI'], text: 'Predictive security platform for smart grids, using dual AI analyzers to detect cyber-attacks in real time.', repo: 'https://github.com/adityacodess/aegisgrid' } },
                { type: 'project', name: 'arcade', x: TILE_SIZE * 12, y: TILE_SIZE * 2, width: TILE_SIZE * 2, height: TILE_SIZE * 2, content: { title: 'Airborne Ledger', type: 'Simulation & Security Platform', fields: ['Drones', 'Cryptography'], text: 'Secure communication system for drone swarms with decentralized validation and live interactive simulations.', repo: 'https://github.com/adityacodess/airborne_ledger' } },
                { type: 'door', name: 'door', x: TILE_SIZE * 7, y: TILE_SIZE * 9, width: TILE_SIZE * 2, height: TILE_SIZE, target: { scene: 1, x: TILE_SIZE * 7, y: TILE_SIZE * 2 } },
                {
                    type: 'easterEgg', name: 'egg1', x: TILE_SIZE * 14, y: TILE_SIZE * 8, width: TILE_SIZE, height: TILE_SIZE,
                    interaction: { 
                        type: 'terminal', 
                        sound: { name: 'uiiiai_cat', delay: 1000 },
                        showCat: true,
                        payload: [ "system.log: Anomaly detected.", "Running diagnostics on 'uiiiai_cat.mp3'...", "Result: File contains 150% of the daily recommended dose of chaos.", "Conclusion: It's not a bug, it's the main character.", "Deploying 3D model..." ] 
                    }
                },
                {
                    type: 'easterEgg', name: 'egg1', x: TILE_SIZE * 1, y: TILE_SIZE * 8, width: TILE_SIZE, height: TILE_SIZE,
                    interaction: { 
                        type: 'terminal', 
                        sound: { name: 'rickroll', delay: 0 },
                        payload: [ "Never gonna give you up...", "Never gonna let you down...", "Never gonna run around and desert you...", "Got 'em." ] 
                    }
                }
            ]
        },
        // Scene 1: The Lab
        {
            map: [ [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], ],
            objects: [ { type: 'project', name: 'bookshelf', x: TILE_SIZE * 2, y: TILE_SIZE * 4, width: TILE_SIZE, height: TILE_SIZE * 3, content: { title: 'NeuraNest HubAI', type: 'AI Ecosystem', fields: ['Productivity', 'AI'], text: 'Personalized AI hub with modules for tutoring, mental wellness, planning, creativity, and more.', repo: 'https://github.com/adityacodess/neuranest_hubai' } }, { type: 'project', name: 'table', x: TILE_SIZE * 7, y: TILE_SIZE * 7, width: TILE_SIZE * 2, height: TILE_SIZE, content: { title: 'GreenGaze', type: 'Web Application', fields: ['AI', 'Sustainability'], text: 'AI-powered sustainability dashboard that tracks waste and carbon stats using Python, Streamlit, and Firebase.', repo: 'https://github.com/adityacodess/greengaze' } }, { type: 'project', name: 'cabinet', x: TILE_SIZE * 12, y: TILE_SIZE * 4, width: TILE_SIZE, height: TILE_SIZE * 2, content: { title: 'ForensiX', type: 'Desktop Application', fields: ['Cybersecurity', 'Forensics'], text: 'Drive scanning and recovery tool to detect oversized, hidden, or suspicious files on external drives.', repo: 'https://github.com/adityacodess/forensix' } }, { type: 'door', name: 'door', x: TILE_SIZE * 7, y: TILE_SIZE, width: TILE_SIZE * 2, height: TILE_SIZE, target: { scene: 0, x: TILE_SIZE * 7, y: TILE_SIZE * 8 } }, { type: 'easterEgg', name: 'egg1', x: TILE_SIZE * 1, y: TILE_SIZE * 8, width: TILE_SIZE, height: TILE_SIZE, interaction: { type: 'terminal', payload: [ "Booting up adityaOS v6.9...", "Running self-diagnosis...", "Error: Caffeination levels critical. User is likely rage-coding.", "Compiling memes... Done.", "Deploying portfolio...", "All systems nominal. Have a nice day, hacker." ] } }, { type: 'easterEgg', name: 'egg1', x: TILE_SIZE * 14, y: TILE_SIZE * 1, width: TILE_SIZE, height: TILE_SIZE, interaction: { type: 'terminal', payload: [ "WARNING: You have discovered a legacy feature.", "This was originally a bug that crashed the entire portfolio.", "But now it's a feature that... well, it opens this terminal.", "Task failed successfully.", "Have a cookie. 🍪" ] } } ]
        }
    ];

    // --- Asset Loading ---
    function loadAsset(loader, source) { return Object.entries(source).map(([name, src]) => loader(name, src)); }
    function loadSprite(name, src) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { sprites[name] = img; resolve(); }; img.onerror = () => reject(new Error(`Failed to load sprite: ${name}`)); img.src = src; }); }
    function loadSound(name, src) { return new Promise((resolve) => { sounds[name] = new Audio(src); resolve(); }); }

    // --- NEW, ROBUST 3D LOGIC ---
    function startCatAnimation() {
        if (typeof THREE === 'undefined') {
            console.error("Three.js is not loaded.");
            return;
        }

        // 1. Create scene, camera, and renderer from scratch
        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(75, catContainer.clientWidth / catContainer.clientHeight, 0.1, 1000);
        threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        threeRenderer.setSize(catContainer.clientWidth, catContainer.clientHeight);
        threeRenderer.setPixelRatio(window.devicePixelRatio);
        catContainer.appendChild(threeRenderer.domElement);

        // 2. Add lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
        hemiLight.position.set(0, 20, 0);
        threeScene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(10, 10, 10);
        threeScene.add(dirLight);

        // --- ADJUSTED CAMERA POSITION ---
        threeCamera.position.z = 4;

        // 3. Load the model
        const loader = new THREE.GLTFLoader();
        loader.load('assets/cat.glb', (gltf) => {
            catModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(catModel);
            const center = box.getCenter(new THREE.Vector3());
            catModel.position.sub(center);

            // --- ADJUSTED SCALE ---
            catModel.scale.set(5, 5, 5);

            threeScene.add(catModel);
            animateCat();
        }, undefined, (error) => {
            console.error('Error loading cat.glb:', error);
            catContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error: Could not load 3D model.</p>';
        });

        function animateCat() {
            catAnimationId = requestAnimationFrame(animateCat);
            if (catModel) {
                 // --- ADJUSTED ROTATION SPEED ---
                catModel.rotation.y += 0.08;
            }
            if (threeRenderer && threeScene && threeCamera) {
                threeRenderer.render(threeScene, threeCamera);
            }
        }
    }

    function stopCatAnimation() {
        if (catAnimationId) {
            cancelAnimationFrame(catAnimationId);
        }
        if (threeRenderer) {
            threeRenderer.dispose();
        }
        if (catContainer) {
            catContainer.innerHTML = '';
        }
        threeScene = null;
        threeCamera = null;
        threeRenderer = null;
        catModel = null;
        catAnimationId = null;
    }
    
    // --- Drawing & Game Logic ---
    function drawScene() { const scene = scenes[currentScene]; for (let y = 0; y < scene.map.length; y++) { for (let x = 0; x < scene.map[y].length; x++) { const tile = scene.map[y][x]; const sprite = tile === 1 ? sprites.wall : sprites.floor; if (sprite) ctx.drawImage(sprite, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE); } } scene.objects.forEach(obj => { const sprite = sprites[obj.name]; if (sprite) ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height); }); }
    function drawPlayer() { if (sprites.player) { const frameX = player.animationFrame * (sprites.player.width / 2); ctx.drawImage(sprites.player, frameX, 0, sprites.player.width / 2, sprites.player.height, player.x, player.y, player.width, player.height); } }
    function checkCollision(x, y) { const scene = scenes[currentScene]; const mapWidth = scene.map[0].length * TILE_SIZE; const mapHeight = scene.map.length * TILE_SIZE; if (x < TILE_SIZE || x + player.width > mapWidth - TILE_SIZE || y < TILE_SIZE || y + player.height > mapHeight - TILE_SIZE) { return true; } const collisionObjects = scene.objects.filter(obj => obj.type === 'project'); for (const obj of collisionObjects) { if (x < obj.x + obj.width && x + player.width > obj.x && y < obj.y + obj.height && y + player.height > obj.y) { return true; } } return false; }
    function updatePlayerPosition() { let newX = player.x; let newY = player.y; player.isMoving = false; if (keys['ArrowUp'] || keys['w']) { newY -= playerSpeed; player.isMoving = true; } if (keys['ArrowDown'] || keys['s']) { newY += playerSpeed; player.isMoving = true; } if (keys['ArrowLeft'] || keys['a']) { newX -= playerSpeed; player.isMoving = true; } if (keys['ArrowRight'] || keys['d']) { newX += playerSpeed; player.isMoving = true; } if (player.isMoving) { player.frameCounter++; if (player.frameCounter >= player.frameDelay) { player.frameCounter = 0; player.animationFrame = (player.animationFrame + 1) % 2; } } else { player.animationFrame = 0; } if (!checkCollision(newX, player.y)) player.x = newX; if (!checkCollision(player.x, newY)) player.y = newY; }
    function checkForInteraction() { currentInteractiveObject = null; const allObjects = scenes[currentScene].objects; for (const obj of allObjects) { const zonePadding = obj.type === 'door' ? TILE_SIZE / 4 : TILE_SIZE / 2; const interactionZone = { x: obj.x - zonePadding, y: obj.y - zonePadding, width: obj.width + (zonePadding * 2), height: obj.height + (zonePadding * 2) }; if (player.x < interactionZone.x + interactionZone.width && player.x + player.width > interactionZone.x && player.y < interactionZone.y + interactionZone.height && player.y + player.height > interactionZone.y) { currentInteractiveObject = obj; break; } } interactionPrompt.classList.toggle('hidden', !currentInteractiveObject); }

    function triggerInteraction() {
        if (!currentInteractiveObject) return;
        switch (currentInteractiveObject.type) {
            case 'project': showInfoModal(currentInteractiveObject); break;
            case 'door': changeScene(currentInteractiveObject.target.scene, currentInteractiveObject.target.x, currentInteractiveObject.target.y); break;
            case 'easterEgg': triggerEasterEgg(currentInteractiveObject.interaction); break;
        }
    }

    function triggerEasterEgg(interaction) {
        if (interaction.type === 'terminal') {
            showTerminal(interaction.payload, interaction);
        }
    }

    // --- UI and Modals ---
    function showInfoModal(obj) { gameRunning = false; const content = obj.content; modalTitle.textContent = content.title; let htmlContent = `<div class="space-y-4">`; if (content.type || content.fields) { let tagsHtml = '<div class="flex flex-wrap items-center gap-2">'; if (content.type) tagsHtml += `<span class="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">${content.type}</span>`; if (content.fields) content.fields.forEach(field => tagsHtml += `<span class="bg-gray-600 text-gray-200 text-xs font-semibold px-3 py-1 rounded-full">${field}</span>`); tagsHtml += '</div>'; htmlContent += tagsHtml; } htmlContent += `<p class="text-gray-300 leading-relaxed">${content.text}</p>`; if (content.link || content.repo) { let linksHtml = '<div class="pt-2 flex flex-wrap gap-3">'; if (content.link && content.link !== '#') linksHtml += `<a href="${content.link}" target="_blank" class="inline-block bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">Live Demo</a>`; if (content.repo) linksHtml += `<a href="${content.repo}" target="_blank" class="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300">View on GitHub</a>`; linksHtml += '</div>'; htmlContent += linksHtml; } htmlContent += '</div>'; modalContent.innerHTML = htmlContent; infoModal.classList.remove('hidden'); }

    function showTerminal(lines, interaction) {
        gameRunning = false;
        terminalModal.classList.remove('hidden');
        terminalOutput.innerHTML = '';
        catContainer.classList.add('hidden'); 

        if (interaction.sound && sounds[interaction.sound.name]) {
            setTimeout(() => {
                currentPlayingSound = sounds[interaction.sound.name];
                if (currentPlayingSound) {
                    currentPlayingSound.currentTime = 0;
                    currentPlayingSound.play();
                }
            }, interaction.sound.delay);
        }

        let lineIndex = 0;
        let charIndex = 0;
        function type() {
            if (lineIndex >= lines.length) {
                if (interaction.showCat) {
                    catContainer.classList.remove('hidden');
                    startCatAnimation();
                }
                return;
            }
            const line = lines[lineIndex];
            if (charIndex < line.length) {
                terminalOutput.innerHTML += line.charAt(charIndex);
                charIndex++;
                setTimeout(type, 30);
            } else {
                terminalOutput.innerHTML += '<br>';
                lineIndex++;
                charIndex = 0;
                setTimeout(type, 200);
            }
        }
        type();
    }

    // --- Scene Transitions ---
    function changeScene(sceneIndex, newPlayerX, newPlayerY) { gameRunning = false; transitionOverlay.style.opacity = '1'; setTimeout(() => { currentScene = sceneIndex; player.x = newPlayerX; player.y = newPlayerY; handleResize(); gameRunning = true; gameLoop(); transitionOverlay.style.opacity = '0'; }, 300); }
    
    // --- Main Game Loop and Setup ---
    function gameLoop() { if (!gameRunning) return; ctx.clearRect(0, 0, canvas.width, canvas.height); drawScene(); updatePlayerPosition(); checkForInteraction(); drawPlayer(); requestAnimationFrame(gameLoop); }
    function handleResize() { const scene = scenes[currentScene]; if (scene) { const mapWidth = scene.map[0].length * TILE_SIZE; const mapHeight = scene.map.length * TILE_SIZE; canvas.width = mapWidth; canvas.height = mapHeight; } }
    
    function setupEventListeners() {
        window.addEventListener('keydown', e => { if (gameRunning) { keys[e.key] = true; if (e.key.toLowerCase() === 'e') triggerInteraction(); } });
        window.addEventListener('keyup', e => { keys[e.key] = false; });
        closeModalButton.addEventListener('click', () => { infoModal.classList.add('hidden'); gameRunning = true; requestAnimationFrame(gameLoop); });
        
        closeTerminalButton.addEventListener('click', () => {
            if (currentPlayingSound) {
                currentPlayingSound.pause();
                currentPlayingSound.currentTime = 0;
                currentPlayingSound = null;
            }
            stopCatAnimation();
            terminalModal.classList.add('hidden');
            gameRunning = true;
            requestAnimationFrame(gameLoop);
        });
    }
    
    async function init() {
        setupEventListeners();
        try {
            const assetPromises = [ ...loadAsset(loadSprite, spriteSources), ...loadAsset(loadSound, soundSources) ];
            await Promise.all(assetPromises);
            startButton.addEventListener('click', () => { introModal.classList.add('hidden'); changeScene(0, player.x, player.y); });
            startButton.textContent = "START";
            startButton.disabled = false;
        } catch (error) {
            console.error("Could not load all assets. Game cannot start.", error);
            loadingTitle.textContent = "Error!";
            startButton.textContent = "LOAD FAILED";
        }
    }

    init();
});