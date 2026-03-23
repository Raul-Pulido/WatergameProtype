// --- Difficulty Mode Only ---
// --- Difficulty Dropdown Logic ---
const chooseDifficultyBtn = document.getElementById('choose-difficulty-btn');
const difficultyDropdown = document.getElementById('difficulty-dropdown');
const difficultyOptions = document.getElementsByClassName('difficulty-option');
let selectedDifficulty = null;
const difficultySettings = {
    easy: {
        color: '#ffd600',
        textColor: '#1565c0',
        contaminantTarget: 11,
        contaminantRate: 0.35
    },
    medium: {
        color: '#00bcd4',
        textColor: '#fff',
        contaminantTarget: 21,
        contaminantRate: 0.55
    },
    hard: {
        color: '#1565c0',
        textColor: '#fff',
        contaminantTarget: 41,
        contaminantRate: 0.75
    }
};
if (chooseDifficultyBtn && difficultyDropdown) {
    chooseDifficultyBtn.onclick = function(e) {
        e.stopPropagation();
        if (difficultyDropdown.classList.contains('show')) {
            difficultyDropdown.classList.remove('show');
            setTimeout(() => {
                difficultyDropdown.style.display = 'none';
            }, 300); // Match the CSS transition duration
        } else {
            difficultyDropdown.style.display = 'block';
            // Trigger reflow to enable animation
            difficultyDropdown.offsetHeight;
            difficultyDropdown.classList.add('show');
        }
    };
    document.addEventListener('click', function() {
        if (difficultyDropdown.classList.contains('show')) {
            difficultyDropdown.classList.remove('show');
            setTimeout(() => {
                difficultyDropdown.style.display = 'none';
            }, 300);
        }
    });
}
for (let btn of difficultyOptions) {
    btn.onclick = function(e) {
        e.stopPropagation();
        let diff = btn.getAttribute('data-difficulty');
        selectedDifficulty = diff;
        // Animate closing
        difficultyDropdown.classList.remove('show');
        setTimeout(() => {
            difficultyDropdown.style.display = 'none';
            setDifficulty(selectedDifficulty);
            startGame();
        }, 300); // Wait for animation to complete before starting game
    };
}

function setDifficulty(diff) {
    contaminantShots = 0;
    score = 0;
    health = INITIAL_HEALTH;
    waterProtected = 0;
    objects = [];
    projectiles = [];
    player.x = GAME_WIDTH/2 - PLAYER_WIDTH/2;
    player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT/2;
    player.aimAngle = -Math.PI/2;
    currentLevel = 0;
    gameRunning = false;
    gameOver = false;
    pollutionWave = false;
    pollutionWaveTimer = 0;
    lastObjectTime = 0;
    objectInterval = 900;
    splashScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameUI.style.display = 'flex';
    // Show all UI elements
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('message').style.display = 'block';
    message.textContent = 'Let clean water through. Stop contaminants.';
    updateUI();
    if (!canvas) {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        setupInput();
    }
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    createObject();
    animationFrameId = requestAnimationFrame(gameLoop);
    if (eduPopup) eduPopup.style.display = 'none';
    // Set contaminant target and rate
    contaminantTarget = difficultySettings[diff].contaminantTarget;
    customContaminantRate = difficultySettings[diff].contaminantRate;
    difficultyMode = true;
}

let contaminantTarget = 0;
let customContaminantRate = 0.35;
let difficultyMode = false;
// --- Game Constants ---
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const PROJECTILE_WIDTH = 8;
const PROJECTILE_HEIGHT = 16;
const OBJECT_RADIUS = 18;
const INITIAL_HEALTH = 100;
const GROUND_HEIGHT = 32;
const LEVELS = [
    { name: 'Level 1: Light contamination', contaminantRate: 0.3, speed: 2, drought: false },
    { name: 'Level 2: Industrial runoff', contaminantRate: 0.5, speed: 2.7, drought: false },
    { name: 'Level 3: Drought conditions', contaminantRate: 0.4, speed: 3.2, drought: true },
    { name: 'Boss Level: Major contamination source', contaminantRate: 0.7, speed: 4, drought: false, boss: true }
];
const FACTS = [
    'Unsafe water causes preventable diseases worldwide.',
    'Access to clean water improves education and health.',
    'Every drop protected helps a community thrive.',
    'Contaminated water is a leading cause of child mortality.'
];

// --- Game State ---
let currentLevel = 0;
let score = 0;
let health = INITIAL_HEALTH;
let waterProtected = 0;
let objects = [];
let projectiles = [];
let player = { x: GAME_WIDTH/2 - PLAYER_WIDTH/2, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT/2, speed: 6 };
let leftPressed = false, rightPressed = false, shootPressed = false;
let gameRunning = false;
let gameOver = false;
let pollutionWave = false;
let pollutionWaveTimer = 0;
let lastObjectTime = 0;
let objectInterval = 900;
let canvas, ctx;

// --- DOM Elements ---
const splashScreen = document.getElementById('splash-screen');
const startBtn = document.getElementById('start-btn');
const gameUI = document.getElementById('game-ui');
const scoreDisplay = document.getElementById('score');
const healthFill = document.getElementById('health-fill');
const healthBar = document.getElementById('health-bar');
const message = document.getElementById('message');
const levelInfo = document.getElementById('level-info');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const finalScore = document.getElementById('final-score');
const waterProtectedDisplay = document.getElementById('water-protected');
const eduMessage = document.getElementById('edu-message');
const playAgainBtn = document.getElementById('play-again-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const eduPopup = document.getElementById('edu-popup');
const redoBtn = document.getElementById('redo-btn');
// No challenge mode elements or logic
// --- Restart Button Logic ---
if (restartBtn) {
    restartBtn.onclick = function() {
        // If on splash or end screen, ignore
        if (gameUI.style.display !== 'flex') return;
        paused = false;
        pauseBtn.textContent = 'Pause';
        startGame();
    };
}


// --- Milestone Toast Logic ---
const milestoneToast = document.getElementById('milestone-toast');
// Milestone messages for specific scores
const milestoneMessages = {
    5: 'Great start! 5 points!',
    10: 'Halfway there! 10 points!',
    25: 'Keep going! 25 points!',
    50: 'Great job! 50 points!',
    75: 'Impressive! 75 points!',
    100: 'Amazing! 100 points!',
    150: 'Incredible! 150 points!',
    200: 'Unstoppable! 200 points!',
    250: 'Legendary! 250 points!',
    300: 'Water Hero! 300 points!',
    350: 'Clean Water Champion! 350 points!',
    400: 'Guardian of the Flow! 400 points!',
    450: 'Ultimate Defender! 450 points!',
    500: 'Water Warrior! 500 points!'
};
let lastMilestone = 0;
let milestoneToastTimer = null;

function showMilestoneToast(message) {
    if (!milestoneToast) return;
    milestoneToast.textContent = message;
    milestoneToast.style.display = 'block';
    milestoneToast.style.opacity = '1';
    milestoneToast.style.bottom = '90px';
    // Clear any previous timer
    if (milestoneToastTimer) clearTimeout(milestoneToastTimer);
    // Fade out after 2.2s
    milestoneToastTimer = setTimeout(() => {
        milestoneToast.style.opacity = '0';
        milestoneToast.style.bottom = '60px';
        setTimeout(() => {
            milestoneToast.style.display = 'none';
        }, 600);
    }, 2200);
}

function resetMilestoneToast() {
    lastMilestone = 0;
    if (milestoneToast) {
        milestoneToast.style.display = 'none';
        milestoneToast.style.opacity = '0';
    }
    if (milestoneToastTimer) {
        clearTimeout(milestoneToastTimer);
        milestoneToastTimer = null;
    }
}

// --- Utility Functions ---
function randBetween(a, b) { return Math.random() * (b - a) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// --- Splash Screen ---
function showSplash() {
    document.body.style.background = '';
    splashScreen.style.display = 'flex';
    gameUI.style.display = 'none';
    endScreen.style.display = 'none';
    levelInfo.textContent = LEVELS[currentLevel].name;
    // Reset cannon angle
    player.aimAngle = -Math.PI/2;
    // Reset timer
    if (redoBtn) redoBtn.style.display = 'none';
}

// --- Start Game ---
let eduPopupTimer = null;
let contaminantShots = 0;
function startGame() {
    resetMilestoneToast();
    // Cancel any previous animation frame to prevent multiple loops
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Clear any previous popup timer
    if (eduPopupTimer) {
        clearTimeout(eduPopupTimer);
        eduPopupTimer = null;
    }
    contaminantShots = 0;
    score = 0;
    health = INITIAL_HEALTH;
    waterProtected = 0;
    objects = [];
    projectiles = [];
    player.x = GAME_WIDTH/2 - PLAYER_WIDTH/2;
    player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT/2;
    player.aimAngle = -Math.PI/2;
    currentLevel = 0;
    gameRunning = true;
    gameOver = false;
    pollutionWave = false;
    pollutionWaveTimer = 0;
    lastObjectTime = 0;
    objectInterval = 900;
    splashScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameUI.style.display = 'flex';
    // Always clear any red background
    document.body.style.background = '';
    // Show all UI elements
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('message').style.display = 'block';
    message.textContent = 'Let clean water through. Stop contaminants.';
    updateUI();
    if (!canvas) {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        setupInput();
    }
    // Clear canvas before starting
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Start falling objects immediately
    createObject();
    animationFrameId = requestAnimationFrame(gameLoop);
    // Start educational popup timer
    if (eduPopup) {
        eduPopup.style.display = 'none';
    }
    // Start 30 second timer
}

function showEduPopup() {
    if (!gameRunning || paused) {
        if (eduPopup) eduPopup.style.display = 'none';
        return;
    }
    if (eduPopup) {
        eduPopup.textContent = pick(FACTS);
        eduPopup.style.display = 'block';
        eduPopup.style.opacity = '1';
        // Hide after 7 seconds
        setTimeout(() => {
            if (eduPopup) eduPopup.style.opacity = '0.2';
        }, 6000);
    }
}

// --- End Game ---
function endGame(win) {
    gameRunning = false;
    gameOver = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (eduPopupTimer) {
        clearTimeout(eduPopupTimer);
        eduPopupTimer = null;
    }
    if (eduPopup) eduPopup.style.display = 'none';
    gameUI.style.display = 'none';
    endScreen.style.display = 'flex';
    if (win === true) {
        endTitle.textContent = 'Community Thriving!';
        eduMessage.textContent = pick(FACTS);
        if (redoBtn) redoBtn.style.display = 'none';
    } else if (win === false) {
        endTitle.textContent = 'Water supply contaminated.';
        eduMessage.textContent = 'Unsafe water causes preventable diseases worldwide.';
        if (redoBtn) redoBtn.style.display = 'none';
    } else if (win === 'difficulty-win') {
        // Congratulate the player and mention the difficulty and target
        let diffName = 'this difficulty';
        let target = contaminantTarget;
        if (selectedDifficulty && difficultySettings[selectedDifficulty]) {
            diffName = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
            target = difficultySettings[selectedDifficulty].contaminantTarget;
        }
        endTitle.textContent = 'Congratulations!';
        eduMessage.textContent = `You beat the game on ${diffName} mode!\nYou destroyed all ${target} contaminants. The village is safe and thriving!`;
        if (redoBtn) redoBtn.style.display = 'none';
    } else if (win === 'difficulty-lose') {
        let diffName = 'this difficulty';
        let target = contaminantTarget;
        if (selectedDifficulty && difficultySettings[selectedDifficulty]) {
            diffName = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
            target = difficultySettings[selectedDifficulty].contaminantTarget;
        }
        endTitle.textContent = 'Almost there!';
        eduMessage.textContent = `You destroyed all ${target} contaminants on ${diffName} mode, but the village health fell below 75%. Try again!`;
        if (redoBtn) redoBtn.style.display = 'none';
    }
    finalScore.textContent = 'Final Score: ' + score;
    waterProtectedDisplay.textContent = `You protected ${waterProtected} liters of water.`;
}

// --- UI Update ---
function updateUI() {
    scoreDisplay.textContent = 'Score: ' + score;
    let healthPct = Math.max(0, health) / INITIAL_HEALTH;
    healthFill.style.width = (healthPct * 100) + '%';
    if (healthPct > 0.6) healthFill.style.background = '#43ea6d';
    else if (healthPct > 0.3) healthFill.style.background = '#f9e900';
    else healthFill.style.background = '#e53935';

    // --- Milestone Toast Trigger ---
    if (score > 0 && milestoneMessages[score] && score !== lastMilestone) {
        showMilestoneToast(milestoneMessages[score]);
        lastMilestone = score;
    }
}

// --- Object Types ---
function createObject() {
    let level = LEVELS[currentLevel];
    let contaminantRate = difficultyMode ? customContaminantRate : level.contaminantRate;
    let isContaminant = Math.random() < contaminantRate;
    let isClean = !isContaminant;
    if (level.drought && isClean && Math.random() < 0.5) return; // Fewer clean drops in drought
    let x = randBetween(OBJECT_RADIUS, GAME_WIDTH - OBJECT_RADIUS);
    let speed = randBetween(level.speed, level.speed + 1.5) * (pollutionWave ? 1.5 : 1);
    let obj = {
        x, y: -OBJECT_RADIUS, r: OBJECT_RADIUS,
        type: isContaminant ? 'contaminant' : 'clean',
        speed,
        color: isContaminant ? '#e53935' : '#00bcd4',
        glow: false
    };
    objects.push(obj);
}

// --- Pause Button Logic ---
let paused = false;
let animationFrameId = null;
if (pauseBtn) {
    pauseBtn.onclick = function() {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        if (!paused && gameRunning) {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        }
    };
}

// --- Game Loop ---
function gameLoop(ts) {
    if (!gameRunning) { animationFrameId = null; return; }
    if (paused) { animationFrameId = null; return; } // Stop everything if paused
    // Object spawn logic
    if (!lastObjectTime) lastObjectTime = ts;
    let interval = objectInterval * (pollutionWave ? 0.5 : 1);
    if (ts - lastObjectTime > interval) {
        createObject();
        lastObjectTime = ts;
    }
    // Pollution wave
    if (!pollutionWave && Math.random() < 0.0007 * (currentLevel+1)) {
        pollutionWave = true;
        pollutionWaveTimer = 180;
        message.textContent = 'Pollution Wave! Stop the contaminants!';
    }
    if (pollutionWave) {
        pollutionWaveTimer--;
        if (pollutionWaveTimer <= 0) {
            pollutionWave = false;
            message.textContent = 'Let clean water through. Stop contaminants.';
        }
    }
    // Move objects
    for (let obj of objects) obj.y += obj.speed;
    // Move projectiles
    for (let p of projectiles) {
        p.x += p.dx * p.speed;
        p.y += p.dy * p.speed;
    }
    // Player movement
    if (leftPressed) player.x -= player.speed;
    if (rightPressed) player.x += player.speed;
    player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, player.x));
    // Collision detection
    handleCollisions();
    // Remove off-screen objects
    objects = objects.filter(obj => obj.y < GAME_HEIGHT + obj.r);
    projectiles = projectiles.filter(p => p.x > -20 && p.x < GAME_WIDTH+20 && p.y > -20 && p.y < GAME_HEIGHT+20);
    // Draw
    drawGame();
    // Check win/lose
    if (health <= 0) {
        endGame(false);
        animationFrameId = null;
        return;
    }
    if (objects.length === 0 && currentLevel === LEVELS.length-1 && !gameOver) {
        endGame(true);
        animationFrameId = null;
        return;
    }
    // Level progression
    if (score >= (currentLevel+1)*200 && currentLevel < LEVELS.length-1) {
        currentLevel++;
        levelInfo.textContent = LEVELS[currentLevel].name;
        // No popup, just update level info
    }
    updateUI();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Drawing ---
function drawGame() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Draw green ground bar
    ctx.save();
    ctx.fillStyle = '#43ea6d';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    ctx.restore();

    // Draw player as a water cannon sitting on the green bar
    ctx.save();
    ctx.translate(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2);
    // Cannon base
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.ellipse(0, 10, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cannon barrel (rotated if aiming)
    let angle = player.aimAngle || -Math.PI/2;
    ctx.rotate(angle + Math.PI/2);
    ctx.fillStyle = '#00bcd4';
    ctx.fillRect(-7, -18, 14, 28);
    // Cannon tip
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#b3e5fc';
    ctx.fill();
    ctx.restore();

    // Draw projectiles (red laser)
    for (let p of projectiles) {
        ctx.save();
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.dx * 18, p.y + p.dy * 18);
        ctx.stroke();
        ctx.restore();
    }
    // Draw objects
    for (let obj of objects) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.r, 0, 2*Math.PI);
        ctx.fillStyle = obj.color;
        ctx.shadowColor = obj.glow ? (obj.type==='clean' ? '#43ea6d' : '#e53935') : 'transparent';
        ctx.shadowBlur = obj.glow ? 24 : 0;
        ctx.fill();
        ctx.restore();
    }
}

// --- Collisions ---
function handleCollisions() {
    // Projectiles vs objects
    for (let i = objects.length-1; i >= 0; i--) {
        let obj = objects[i];
        for (let j = projectiles.length-1; j >= 0; j--) {
            let p = projectiles[j];
            let dx = obj.x - p.x;
            let dy = obj.y - p.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < obj.r) {
                // Hit!
                if (obj.type === 'contaminant') {
                    contaminantShots++;
                    if (contaminantShots % 5 === 0) {
                        showEduPopup();
                    }
                    score += 10;
                    obj.glow = true;
                    setTimeout(()=>{obj.glow=false;}, 200);
                    // Check for difficulty win condition
                    if (difficultyMode && contaminantShots >= contaminantTarget) {
                        // End game with win/lose based on health
                        setTimeout(() => {
                            if (health >= 75) {
                                endGame('difficulty-win');
                            } else {
                                endGame('difficulty-lose');
                            }
                        }, 300);
                        return;
                    }
                } else {
                    score -= 10;
                    health -= 7;
                    obj.glow = true;
                    setTimeout(()=>{obj.glow=false;}, 200);
                }
                objects.splice(i,1);
                projectiles.splice(j,1);
                break;
            }
        }
    }
    // Objects reaching bottom
    for (let i = objects.length-1; i >= 0; i--) {
        let obj = objects[i];
        if (obj.y + obj.r >= GAME_HEIGHT) {
            if (obj.type === 'clean') {
                score += 5;
                health = Math.min(INITIAL_HEALTH, health + 8);
                waterProtected += 1;
                obj.glow = true;
                setTimeout(()=>{obj.glow=false;}, 200);
            } else {
                score -= 15;
                health -= 22;
                obj.glow = true;
                setTimeout(()=>{obj.glow=false;}, 200);
            }
            objects.splice(i,1);
        }
    }
}

// --- Player Controls ---
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') leftPressed = true;
    if (e.code === 'ArrowRight') rightPressed = true;
    if (e.code === 'Space') shoot();
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') leftPressed = false;
    if (e.code === 'ArrowRight') rightPressed = false;
});

function shootAt(targetX, targetY) {
    if (!gameRunning) return;
    // Only allow a few projectiles at a time
    if (projectiles.length > 3) return;
    let px = player.x + PLAYER_WIDTH/2;
    let py = player.y + PLAYER_HEIGHT/2 - 10;
    let dx = targetX - px;
    let dy = targetY - py;
    let len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return;
    dx /= len;
    dy /= len;
    // Store angle for cannon rotation
    player.aimAngle = Math.atan2(dy, dx);
    projectiles.push({ x: px, y: py, dx, dy, speed: 14 });
}

// For keyboard: shoot straight up
function shoot() {
    shootAt(player.x + PLAYER_WIDTH/2, player.y - 60);
}

// Touch and click controls for aiming and shooting
let touchStartX = null;
function setupInput() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    // Touch move for left/right
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
        }
    });
    canvas.addEventListener('touchmove', e => {
        if (touchStartX !== null && e.touches.length === 1) {
            let dx = e.touches[0].clientX - touchStartX;
            player.x += dx * 0.7;
            player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, player.x));
            touchStartX = e.touches[0].clientX;
        }
    });
    canvas.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1) {
            let rect = canvas.getBoundingClientRect();
            let tx = e.changedTouches[0].clientX - rect.left;
            let ty = e.changedTouches[0].clientY - rect.top;
            shootAt(tx, ty);
        }
        touchStartX = null;
    });
    // Mouse click for desktop
    canvas.addEventListener('mousedown', e => {
        let rect = canvas.getBoundingClientRect();
        let mx = e.clientX - rect.left;
        let my = e.clientY - rect.top;
        shootAt(mx, my);
    });
}

// --- Fact/Education Popups ---
function showFactPopup() {
    gameRunning = false;
    setTimeout(() => {
        alert(pick(FACTS));
        gameRunning = true;
        requestAnimationFrame(gameLoop);
    }, 100);
}

// --- Button Events ---
if (startBtn) startBtn.onclick = startGame;
if (playAgainBtn) {
    playAgainBtn.onclick = () => {
        // Reset all game state
        gameRunning = false;
        gameOver = false;
        paused = false;
        currentLevel = 0;
        score = 0;
        health = INITIAL_HEALTH;
        waterProtected = 0;
        contaminantShots = 0;
        objects = [];
        projectiles = [];
        pollutionWave = false;
        pollutionWaveTimer = 0;
        lastObjectTime = 0;
        objectInterval = 900;
        selectedDifficulty = null;
        difficultyMode = false;
        contaminantTarget = 0;
        
        // Reset player position and angle
        player.x = GAME_WIDTH/2 - PLAYER_WIDTH/2;
        player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT/2;
        player.aimAngle = -Math.PI/2;
        
        // Cancel any running animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Clear any timers
        if (eduPopupTimer) {
            clearTimeout(eduPopupTimer);
            eduPopupTimer = null;
        }
        
        // Reset pause button
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        
        // Show splash screen
        showSplash();
    };
}