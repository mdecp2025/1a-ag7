// 遊戲狀態管理
const GameState = {
    MAIN_MENU: 0,
    GAME_SELECTION: 1,
    DIFFICULTY_SELECT: 2,
    PLAYING: 3,
    PAUSED: 4,
    GAME_OVER: 5,
    SURVIVAL_GAME: 6,
    SURVIVAL_MODE_SELECT: 7
};

// 難度設定 - 修改隨機模式的設定
const Difficulty = {
    EASY: {
        birds: 15,
        speed: 2,
        spawnMin: 1000,
        spawnMax: 2500,
        name: "簡單",
        hasBombs: false, // 簡單模式沒有炸彈
        bombSpawnMin: 0,
        bombSpawnMax: 0
    },
    NORMAL: {
        birds: 20,
        speed: 2.3,
        spawnMin: 800,
        spawnMax: 2200,
        name: "一般",
        hasBombs: true, // 一般模式有炸彈
        bombSpawnMin: 4000, // 4秒
        bombSpawnMax: 8000, // 8秒
        bombSize: 60, // 一般模式炸彈大小固定為60
        bombPenalty: 10 // 扣10分
    },
    HARD: {
        birds: 30,
        speed: 2.8,
        spawnMin: 600,
        spawnMax: 1800,
        name: "困難",
        hasBombs: true, // 困難模式有炸彈
        bombSpawnMin: 1500, // 1.5秒
        bombSpawnMax: 3500, // 3.5秒
        bombSize: 60, // 困難模式炸彈大小固定為60
        bombPenalty: 10 // 扣10分
    },
    RANDOM: {
        birds: Infinity, // 無限生成飛鳥
        timeLimit: 40000, // 40秒遊戲時間
        speed: 2.5,
        spawnMin: 1000,   // 1秒
        spawnMax: 4500,   // 4.5秒
        name: "隨機",
        hasBombs: true, // 隨機模式有炸彈
        bombSpawnMin: 500, // 0.5秒
        bombSpawnMax: 5000, // 5秒，不規律
        bombSizes: [20, 30, 40], // 自定義炸彈大小：直徑1、1.5、2倍（基數20）
        bombPenalties: [5, 10, 20], // 對應的扣分
        bombSize: "custom" // 表示使用自定義大小
    }
};

// 遊戲變數
let currentState = GameState.MAIN_MENU;
let currentDifficulty = Difficulty.EASY;
let score = 0;
let birds = [];
let bombs = []; // 新增炸彈陣列
let birdsSpawned = 0;
let birdsKilled = 0;
let birdsEscaped = 0; // 記錄逃脫的飛鳥數量
let lastSpawnTime = 0;
let lastBombSpawnTime = 0; // 記錄上次生成炸彈的時間
let bombSpawnInterval = 0; // 炸彈生成間隔
let gameCanvas, ctx;
let crosshair;
let gameHistory = [];
let currentLanguage = 'zh-TW';
let currentGameId = 'birdShooting';
let selectedBackgroundFile = null;

// 新增計時相關變數
let gameStartTime = 0;
let gameTimer = null;
let isRandomMode = false;

// 游戏数据 - 新增survive游戏
const games = {
    'all': [
        { id: 'birdShooting', name: '飛鳥射擊遊戲', category: 'shooting' },
        { id: 'survive', name: '生存射擊遊戲', category: 'shooting' }
    ],
    'shooting': [
        { id: 'birdShooting', name: '飛鳥射擊遊戲', category: 'shooting' },
        { id: 'survive', name: '生存射擊遊戲', category: 'shooting' }
    ],
    'driving': [],
    'card': [],
    'action': []
};

// 语言数据 - 只保留中文繁體、中文簡體和英文
const languageData = {
    'zh-TW': {
        title: '永恆領域遊戲',
        startButton: '開始遊戲',
        instructions: '按空格鍵或點擊開始按鈕開始遊戲',
        // 游戏选择界面
        allGames: '所有遊戲',
        shootingGames: '射擊遊戲',
        drivingGames: '開車遊戲',
        cardGames: '紙牌遊戲',
        actionGames: '動作遊戲',
        settings: '設定',
        backToMain: '返回',
        noGames: '暫無遊戲',
        // 难度选择界面
        selectDifficulty: '選擇難度',
        easy: '簡單',
        normal: '一般',
        hard: '困難',
        random: '隨機難度',
        exit: '退出',
        resume: '繼續',
        history: '歷史記錄',
        pauseInstructions: '按ESC鍵暫停遊戲',
        // 游戏界面
        score: '分數',
        birdsLeft: '剩餘飛鳥',
        timeLeft: '剩餘時間',
        gameOver: '遊戲結束',
        yourScore: '你的分數',
        continue: '繼續',
        // 历史记录
        historyTitle: '歷史記錄',
        noHistory: '暫無遊戲記錄',
        // 设置
        languageSwitch: '語言切換',
        backgroundChange: '背景更換',
        changeImageTop: '更改',
        changeImageBottom: '圖片',
        resetBackgroundTop: '重置',
        resetBackgroundBottom: '背景',
        // 语言选项
        chineseTraditional: '中文繁體',
        chineseSimplified: '中文簡體',
        english: '英文',
        // 檔案總管
        fileExplorerTitle: '選擇背景圖片',
        selectFile: '選擇檔案',
        noFileSelected: '未選擇檔案',
        applyBackground: '套用背景'
    },
    'zh-CN': {
        title: '永恒领域游戏',
        startButton: '开始游戏',
        instructions: '按空格键或点击开始按钮开始游戏',
        // 游戏选择界面
        allGames: '所有游戏',
        shootingGames: '射击游戏',
        drivingGames: '开车游戏',
        cardGames: '纸牌游戏',
        actionGames: '动作游戏',
        settings: '设定',
        backToMain: '返回',
        noGames: '暂无游戏',
        // 难度选择界面
        selectDifficulty: '选择难度',
        easy: '简单',
        normal: '一般',
        hard: '困难',
        random: '随机难度',
        exit: '退出',
        resume: '继续',
        history: '历史记录',
        pauseInstructions: '按ESC键暂停游戏',
        // 游戏界面
        score: '分数',
        birdsLeft: '剩余飞鸟',
        timeLeft: '剩余时间',
        gameOver: '游戏结束',
        yourScore: '你的分数',
        continue: '继续',
        // 历史记录
        historyTitle: '历史记录',
        noHistory: '暂无游戏记录',
        // 设置
        languageSwitch: '语言切换',
        backgroundChange: '背景更换',
        changeImageTop: '更改',
        changeImageBottom: '图片',
        resetBackgroundTop: '重置',
        resetBackgroundBottom: '背景',
        // 语言选项
        chineseTraditional: '中文繁体',
        chineseSimplified: '中文简体',
        english: '英文',
        // 檔案總管
        fileExplorerTitle: '选择背景图片',
        selectFile: '选择档案',
        noFileSelected: '未选择档案',
        applyBackground: '套用背景'
    },
    'en': {
        title: 'Eternal Realm Game',
        startButton: 'Start Game',
        instructions: 'Press space or click start button to begin',
        // 游戏选择界面
        allGames: 'All Games',
        shootingGames: 'Shooting Games',
        drivingGames: 'Driving Games',
        cardGames: 'Card Games',
        actionGames: 'Action Games',
        settings: 'Settings',
        backToMain: 'Back',
        noGames: 'No Games Available',
        // 难度选择界面
        selectDifficulty: 'Select Difficulty',
        easy: 'Easy',
        normal: 'Normal',
        hard: 'Hard',
        random: 'Random',
        exit: 'Exit',
        resume: 'Resume',
        history: 'History',
        pauseInstructions: 'Press ESC to pause game',
        // 游戏界面
        score: 'Score',
        birdsLeft: 'Birds Left',
        timeLeft: 'Time Left',
        gameOver: 'Game Over',
        yourScore: 'Your Score',
        continue: 'Continue',
        // 历史记录
        historyTitle: 'History',
        noHistory: 'No Game Records',
        // 设置
        languageSwitch: 'Language Switch',
        backgroundChange: 'Background Change',
        changeImageTop: 'Change',
        changeImageBottom: 'Image',
        resetBackgroundTop: 'Reset',
        resetBackgroundBottom: 'Background',
        // 语言选项
        chineseTraditional: 'Chinese Traditional',
        chineseSimplified: 'Chinese Simplified',
        english: 'English',
        // 檔案總管
        fileExplorerTitle: 'Select Background Image',
        selectFile: 'Select File',
        noFileSelected: 'No file selected',
        applyBackground: 'Apply Background'
    }
};

// ========== 生存射擊遊戲變數 ==========
const survivalGameState = {
    currentScreen: 'main',
    isPaused: false,
    player: {
        x: 400,
        y: 300,
        size: 20,
        health: 200, // 血量改為200點
        maxHealth: 200,
        speed: 5,
        bulletDamage: 5, // 子彈傷害初始5點
        angle: 0,
        permanentHealthIncrease: 0 // 記錄永久生命值增加
    },
    bullets: [],
    enemies: [],
    bosses: [], // 新增boss怪陣列
    powerUps: [], // 新增能量塊陣列
    score: 0,
    lastShot: 0,
    shotDelay: 200,
    ammo: Infinity, // 子彈改為無限
    maxAmmo: Infinity,
    reloading: false,
    keys: {},
    mouse: { x: 0, y: 0 },
    lastEnemySpawn: 0,
    lastBossSpawn: 0, // 記錄上次生成boss的時間
    bossSpawnInterval: 90000, // 1.5分鐘生成一個boss (90秒 * 1000毫秒)
    enemySpawnDelay: 500,
    gameLoopId: null,
    bossGeneration: 0, // 記錄boss生成次數
    // 新增變數
    canSpawnEnemies: true, // 是否可以生成小怪
    maxEnemies: 9, // 場上最多小怪數量
    enemyBaseSpeed: 2.0, // 小怪基礎速度（均勻）
    bossWarningActive: false, // Boss警告是否激活
    bossWarningTime: 5000, // Boss出現前警告時間（5秒）
    bossCooldownTime: 5000, // Boss死後冷卻時間（5秒）
    bossAlive: false, // Boss是否存活
    lastBossDeathTime: 0, // 上次Boss死亡時間
    warningShown: false // 警告是否已顯示
};

// 生存射擊遊戲元素
let survivalCanvas, survivalCtx;

// ========== 新增Boss圖片變數 ==========
let bossImage = null;
let bossImageLoaded = false;
let fallbackBossImage = null;

// 初始化遊戲
function init() {
    gameCanvas = document.getElementById('gameCanvas');
    ctx = gameCanvas.getContext('2d');
    crosshair = document.getElementById('crosshair');
    
    // 初始化生存射擊遊戲
    initSurvivalGame();
    
    // 從localStorage加載歷史記錄
    loadHistory();
    
    // 從localStorage加載背景圖片
    loadBackgroundImage();
    
    // 設置畫布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 創建科技感光點
    createTechDots();
    
    // 開始遊戲循環
    requestAnimationFrame(gameLoop);
}

// 初始化生存射擊遊戲
function initSurvivalGame() {
    survivalCanvas = document.getElementById('survivalGameCanvas');
    survivalCtx = survivalCanvas.getContext('2d');
    
    // 設置畫布大小
    resizeSurvivalCanvas();
    window.addEventListener('resize', resizeSurvivalCanvas);
    
    // 設置事件監聽器
    setupSurvivalEventListeners();
    
    // 初始化Boss圖片
    initBossImage();
}

// 初始化Boss圖片
function initBossImage() {
    bossImage = new Image();
    bossImage.onload = function() {
        bossImageLoaded = true;
        console.log('Boss圖片加載完成');
    };
    bossImage.onerror = function() {
        // 如果圖片加載失敗，創建備用Boss圖片
        bossImageLoaded = false;
        createFallbackBossImage();
        console.log('Boss圖片加載失敗，使用繪製的Boss');
    };
    // 設置圖片來源 - 這是您提供的網址
    bossImage.crossOrigin = "anonymous";
    bossImage.src = 'https://pixlab24.com/character/2626/';
}

// 創建備用Boss圖片（當外部圖片無法加載時使用）
function createFallbackBossImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // 繪製機械風格Boss
    drawFallbackBoss(ctx, 100, 100, 80);
    
    // 將繪製的內容轉為Image對象
    fallbackBossImage = new Image();
    fallbackBossImage.onload = function() {
        bossImage = fallbackBossImage;
        bossImageLoaded = true;
    };
    fallbackBossImage.src = canvas.toDataURL();
}

// 繪製備用機械Boss
function drawFallbackBoss(ctx, x, y, size) {
    // 保存畫布狀態
    ctx.save();
    
    // 主體 - 機械核心
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // 外圈 - 裝甲環
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // 內圈 - 能量環
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 中心能量核心
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#4cc9f0');
    gradient.addColorStop(1, 'rgba(76, 201, 240, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 裝甲板
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const px = x + Math.cos(angle) * size * 0.7;
        const py = y + Math.sin(angle) * size * 0.7;
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        
        // 裝甲板形狀
        ctx.beginPath();
        ctx.moveTo(-15, -10);
        ctx.lineTo(15, -10);
        ctx.lineTo(20, 0);
        ctx.lineTo(15, 10);
        ctx.lineTo(-15, 10);
        ctx.lineTo(-20, 0);
        ctx.closePath();
        ctx.fill();
        
        // 裝甲板細節
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(10, -5);
        ctx.lineTo(12, 0);
        ctx.lineTo(10, 5);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 眼睛/感應器
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛光效
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y - size * 0.25, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // 武器/觸手
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4 + Math.PI/4;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * size * 0.8, y + Math.sin(angle) * size * 0.8);
        ctx.lineTo(x + Math.cos(angle) * size * 1.5, y + Math.sin(angle) * size * 1.5);
        ctx.stroke();
    }
    
    ctx.restore();
}

// 調整生存射擊遊戲畫布大小
function resizeSurvivalCanvas() {
    survivalCanvas.width = window.innerWidth;
    survivalCanvas.height = window.innerHeight;
    if (survivalGameState.currentScreen === 'game' && survivalGameState.player) {
        survivalGameState.player.x = Math.min(survivalGameState.player.x, survivalCanvas.width - survivalGameState.player.size);
        survivalGameState.player.y = Math.min(survivalGameState.player.y, survivalCanvas.height - survivalGameState.player.size);
    }
}

// 設置生存射擊遊戲事件監聽器
function setupSurvivalEventListeners() {
    // 屏幕切換
    document.getElementById('survivalStartBtn').addEventListener('click', () => {
        document.getElementById('survivalMainScreen').classList.add('hidden');
        document.getElementById('survivalModeScreen').classList.remove('hidden');
        survivalGameState.currentScreen = 'mode';
    });

    document.getElementById('survivalExitBtn').addEventListener('click', () => {
        // 返回主遊戲選擇界面
        hideSurvivalGame();
        showGameSelectionScreen();
    });

    document.getElementById('survivalGameStartBtn').addEventListener('click', startSurvivalGame);
    document.getElementById('survivalRestartBtn').addEventListener('click', startSurvivalGame);
    
    // 修改：將主選單按鈕改為後退，點擊後返回遊戲選擇畫面
    document.getElementById('survivalMainMenuBtn').addEventListener('click', () => {
        document.getElementById('survivalGameOver').style.display = 'none';
        hideSurvivalGame();
        showGameSelectionScreen(); // 返回遊戲選擇畫面
    });

    // 修改：暫停畫面退出按鈕改為後退，點擊後返回遊戲選擇畫面
    document.getElementById('survivalPauseExitBtn').addEventListener('click', () => {
        toggleSurvivalPause();
        hideSurvivalGame();
        showGameSelectionScreen(); // 返回遊戲選擇畫面
    });

    // 修改：暫停畫面繼續按鈕事件
    document.getElementById('survivalResumeBtn').addEventListener('click', toggleSurvivalPause);

    // ESC鍵監聽
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && survivalGameState.currentScreen === 'game') {
            toggleSurvivalPause();
        }
    });

    // 輸入處理
    survivalCanvas.addEventListener('mousemove', (e) => {
        const rect = survivalCanvas.getBoundingClientRect();
        survivalGameState.mouse.x = e.clientX - rect.left;
        survivalGameState.mouse.y = e.clientY - rect.top;
    });

    survivalCanvas.addEventListener('mousedown', (e) => {
        if (survivalGameState.currentScreen === 'game' && !survivalGameState.reloading && !survivalGameState.isPaused) {
            shootSurvival();
        }
    });

    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
        if (currentState === GameState.SURVIVAL_GAME) {
            survivalGameState.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'r' && survivalGameState.currentScreen === 'game' && !survivalGameState.isPaused) {
                reloadSurvival();
            }
            
            if (e.key === ' ' && survivalGameState.currentScreen === 'game' && !survivalGameState.isPaused) {
                shootSurvival();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (currentState === GameState.SURVIVAL_GAME) {
            survivalGameState.keys[e.key.toLowerCase()] = false;
        }
    });
}

// 顯示生存射擊遊戲
function showSurvivalGame() {
    // 隱藏所有其他畫面
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('gameSelectionScreen').classList.add('hidden');
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('historyPopup').style.display = 'none';
    document.getElementById('fileExplorerModal').style.display = 'none';
    
    // 顯示生存射擊遊戲
    document.getElementById('survivalGameScreen').classList.remove('hidden');
    document.getElementById('survivalMainScreen').classList.remove('hidden');
    document.getElementById('survivalModeScreen').classList.add('hidden');
    document.getElementById('survivalGameOver').style.display = 'none';
    document.getElementById('survivalPauseScreen').style.display = 'none';
    
    currentState = GameState.SURVIVAL_GAME;
    survivalGameState.currentScreen = 'main';
    
    // 重置遊戲狀態
    survivalGameState.player = {
        x: survivalCanvas.width / 2,
        y: survivalCanvas.height / 2,
        size: 20,
        health: 200,
        maxHealth: 200,
        speed: 5,
        bulletDamage: 5,
        angle: 0,
        permanentHealthIncrease: 0
    };
    survivalGameState.bullets = [];
    survivalGameState.enemies = [];
    survivalGameState.bosses = [];
    survivalGameState.powerUps = [];
    survivalGameState.score = 0;
    survivalGameState.ammo = Infinity;
    survivalGameState.reloading = false;
    survivalGameState.lastEnemySpawn = Date.now();
    survivalGameState.lastBossSpawn = Date.now();
    survivalGameState.bossGeneration = 0;
    survivalGameState.canSpawnEnemies = true;
    survivalGameState.bossAlive = false;
    survivalGameState.lastBossDeathTime = 0;
    survivalGameState.warningShown = false;
    
    updateSurvivalHUD();
}

// 隱藏生存射擊遊戲
function hideSurvivalGame() {
    document.getElementById('survivalGameScreen').classList.add('hidden');
    // 停止遊戲循環
    if (survivalGameState.gameLoopId) {
        cancelAnimationFrame(survivalGameState.gameLoopId);
        survivalGameState.gameLoopId = null;
    }
}

// 開始生存射擊遊戲
function startSurvivalGame() {
    document.getElementById('survivalModeScreen').classList.add('hidden');
    document.getElementById('survivalGameOver').style.display = 'none';
    document.getElementById('survivalPauseScreen').style.display = 'none';
    survivalGameState.currentScreen = 'game';
    survivalGameState.isPaused = false;
    
    // 重置遊戲狀態
    survivalGameState.player = {
        x: survivalCanvas.width / 2,
        y: survivalCanvas.height / 2,
        size: 20,
        health: 200,
        maxHealth: 200,
        speed: 5,
        bulletDamage: 5,
        angle: 0,
        permanentHealthIncrease: 0
    };
    survivalGameState.bullets = [];
    survivalGameState.enemies = [];
    survivalGameState.bosses = [];
    survivalGameState.powerUps = [];
    survivalGameState.score = 0;
    survivalGameState.ammo = Infinity;
    survivalGameState.reloading = false;
    survivalGameState.lastEnemySpawn = Date.now();
    survivalGameState.lastBossSpawn = Date.now();
    survivalGameState.bossGeneration = 0;
    survivalGameState.canSpawnEnemies = true;
    survivalGameState.bossAlive = false;
    survivalGameState.lastBossDeathTime = 0;
    survivalGameState.warningShown = false;
    
    updateSurvivalHUD();
    
    // 開始遊戲循環
    survivalGameLoop();
}

// 更新生存射擊遊戲HUD - 修改玩家狀態信息位置
function updateSurvivalHUD() {
    document.getElementById('survivalScoreDisplay').textContent = survivalGameState.score;
    const healthPercent = (survivalGameState.player.health / survivalGameState.player.maxHealth) * 100;
    document.getElementById('survivalHealthFill').style.width = healthPercent + '%';
    
    // 子彈無限
    document.getElementById('survivalAmmoCount').textContent = '∞';
    
    // 顯示玩家屬性 - 移動到右上角
    const playerStats = document.createElement('div');
    playerStats.id = 'playerStats';
    playerStats.style.position = 'absolute';
    playerStats.style.top = '20px';  // 與分數和血量條對齊
    playerStats.style.right = '20px';  // 右側
    playerStats.style.color = 'white';
    playerStats.style.fontSize = '16px';
    playerStats.style.zIndex = '5';
    playerStats.style.textAlign = 'right';  // 右對齊
    playerStats.style.background = 'rgba(0, 0, 0, 0.5)';
    playerStats.style.padding = '10px';
    playerStats.style.borderRadius = '5px';
    playerStats.style.border = '1px solid rgba(76, 201, 240, 0.5)';
    playerStats.style.boxShadow = '0 0 10px rgba(76, 201, 240, 0.3)';
    playerStats.innerHTML = `
        傷害: ${survivalGameState.player.bulletDamage}<br>
        血量: ${survivalGameState.player.health}/${survivalGameState.player.maxHealth}<br>
        生命加成: +${survivalGameState.player.permanentHealthIncrease}
    `;
    
    // 如果已存在則更新，否則添加
    const existingStats = document.getElementById('playerStats');
    if (existingStats) {
        existingStats.innerHTML = playerStats.innerHTML;
        existingStats.style.top = '20px';
        existingStats.style.right = '20px';
        existingStats.style.textAlign = 'right';
    } else {
        document.getElementById('survivalHud').appendChild(playerStats);
    }
}

// 敵人生成 - 修改為控制數量和速度
function spawnSurvivalEnemy() {
    if (survivalGameState.currentScreen !== 'game' || survivalGameState.isPaused) return;
    
    // 檢查是否可以生成小怪
    if (!survivalGameState.canSpawnEnemies) return;
    
    // 檢查場上小怪數量
    if (survivalGameState.enemies.length >= survivalGameState.maxEnemies) return;
    
    const now = Date.now();
    if (now - survivalGameState.lastEnemySpawn < survivalGameState.enemySpawnDelay) return;
    
    survivalGameState.lastEnemySpawn = now;
    
    // 需要生成的小怪數量
    const enemiesToSpawn = survivalGameState.maxEnemies - survivalGameState.enemies.length;
    
    for (let i = 0; i < enemiesToSpawn; i++) {
        // 隨機選擇生成位置（從四個邊緣之一）
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // 上邊
                x = Math.random() * survivalCanvas.width;
                y = -50;
                break;
            case 1: // 右邊
                x = survivalCanvas.width + 50;
                y = Math.random() * survivalCanvas.height;
                break;
            case 2: // 下邊
                x = Math.random() * survivalCanvas.width;
                y = survivalCanvas.height + 50;
                break;
            case 3: // 左邊
                x = -50;
                y = Math.random() * survivalCanvas.height;
                break;
        }
        
        // 小怪血量為15或20點隨機
        const enemyHealth = Math.random() > 0.5 ? 15 : 20;
        
        // 小怪使用均勻速度
        const enemy = {
            x: x,
            y: y,
            size: 15 + Math.random() * 10,
            speed: survivalGameState.enemyBaseSpeed, // 均勻速度
            health: enemyHealth,
            maxHealth: enemyHealth,
            damage: 2, // 小怪傷害
            color: `hsl(${Math.random() * 60}, 100%, 50%)`,
            isBoss: false
        };
        
        survivalGameState.enemies.push(enemy);
    }
    
    // 固定生成速度
    survivalGameState.enemySpawnDelay = 500;
}

// 檢查Boss狀態並更新小怪生成許可
function checkBossStatus() {
    const now = Date.now();
    const timeSinceLastBoss = now - survivalGameState.lastBossSpawn;
    
    // 計算是否可以生成小怪
    let canSpawn = true;
    
    // 冷卻階段：Boss死亡後5秒內
    if (survivalGameState.lastBossDeathTime && 
        now - survivalGameState.lastBossDeathTime < survivalGameState.bossCooldownTime) {
        canSpawn = false;
        
        // 如果冷卻時間還剩2秒以上，顯示倒數訊息
        const timeLeft = survivalGameState.bossCooldownTime - (now - survivalGameState.lastBossDeathTime);
        if (timeLeft > 2000 && Math.floor(timeLeft / 1000) !== Math.floor((timeLeft + 100) / 1000)) {
            const secondsLeft = Math.ceil(timeLeft / 1000);
            if (secondsLeft <= 5) {
                showEffectMessage(`小怪 ${secondsLeft} 秒後恢復生成`, "#4CAF50");
            }
        }
    }
    // 預警階段：Boss生成前5秒
    else if (timeSinceLastBoss >= survivalGameState.bossSpawnInterval - survivalGameState.bossWarningTime && 
            timeSinceLastBoss < survivalGameState.bossSpawnInterval &&
            !survivalGameState.bossAlive) {
        canSpawn = false;
        
        // 顯示警告（僅一次）
        if (!survivalGameState.warningShown) {
            showBossAlert("警告：機械Boss 即將在5秒後出現！");
            survivalGameState.warningShown = true;
        }
        
        // 顯示倒數
        const timeUntilBoss = survivalGameState.bossSpawnInterval - timeSinceLastBoss;
        const secondsLeft = Math.ceil(timeUntilBoss / 1000);
        if (secondsLeft <= 5 && secondsLeft > 0) {
            showEffectMessage(`Boss ${secondsLeft} 秒後出現`, "#FF0000");
        }
    }
    // Boss戰階段
    else if (survivalGameState.bossAlive) {
        canSpawn = false;
    }
    
    survivalGameState.canSpawnEnemies = canSpawn;
}

// 生成boss怪 - 修改為更強大的Boss
function spawnSurvivalBoss() {
    if (survivalGameState.currentScreen !== 'game' || survivalGameState.isPaused) return;
    
    const now = Date.now();
    const timeSinceLastBoss = now - survivalGameState.lastBossSpawn;
    
    // 檢查是否應該生成Boss
    if (timeSinceLastBoss < survivalGameState.bossSpawnInterval || survivalGameState.bossAlive) return;
    
    survivalGameState.bossGeneration++;
    survivalGameState.bossAlive = true;
    survivalGameState.lastBossSpawn = now;
    survivalGameState.warningShown = false;
    
    // boss初始血量80點，每次生成增加20點
    const bossBaseHealth = 80;
    const bossHealth = bossBaseHealth + (survivalGameState.bossGeneration * 20);
    
    // boss傷害每次增加20點
    const bossBaseDamage = 20;
    const bossDamage = bossBaseDamage + (survivalGameState.bossGeneration * 20);
    
    // boss從上方生成
    const x = Math.random() * survivalCanvas.width;
    const y = -100;
    
    const boss = {
        x: x,
        y: y,
        size: 70 + survivalGameState.bossGeneration * 5, // boss體型隨生成次數增加
        speed: 0.8 + (survivalGameState.bossGeneration * 0.08), // 移動速度稍快
        health: bossHealth,
        maxHealth: bossHealth,
        damage: bossDamage,
        color: `hsl(${340 + (survivalGameState.bossGeneration * 5) % 20}, 100%, 50%)`,
        isBoss: true,
        lastShotTime: 0, // 用於控制射擊間隔
        shootDelay: 1500 - (survivalGameState.bossGeneration * 50) // 射擊間隔隨生成次數減少
    };
    
    survivalGameState.bosses.push(boss);
    
    // 顯示boss生成訊息
    showBossAlert(`機械Boss ${survivalGameState.bossGeneration} 出現！`);
}

// 顯示boss警報
function showBossAlert(message) {
    const alert = document.createElement('div');
    alert.textContent = message;
    alert.style.position = 'absolute';
    alert.style.top = '50%';
    alert.style.left = '50%';
    alert.style.transform = 'translate(-50%, -50%)';
    alert.style.color = '#FF0000';
    alert.style.fontSize = '48px';
    alert.style.fontWeight = 'bold';
    alert.style.textShadow = '0 0 10px #FFFFFF, 0 0 20px #FF0000';
    alert.style.zIndex = '1000';
    alert.style.pointerEvents = 'none';
    alert.style.animation = 'bossAlertPulse 1s infinite';
    
    document.getElementById('survivalGameScreen').appendChild(alert);
    
    // 3秒後移除
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}

// 生成能量塊
function spawnPowerUp(x, y, type) {
    let color, effect, size = 15;
    
    switch(type) {
        case 'damage_small': // 傷害+3
            color = '#000000'; // 黑色
            effect = { type: 'damage', value: 3 };
            break;
        case 'heal': // 回血30點
            color = '#ADFF2F'; // 黃綠色
            effect = { type: 'heal', value: 30 };
            break;
        case 'max_health': // 永久生命值增加20點
            color = '#FFD700'; // 金紅色
            effect = { type: 'max_health', value: 20 };
            break;
        case 'damage_big': // 傷害+20點 (boss掉落)
            color = '#E0FFFF'; // 藍白色
            effect = { type: 'damage', value: 20 };
            break;
    }
    
    const powerUp = {
        x: x,
        y: y,
        size: size,
        color: color,
        effect: effect,
        life: 300 // 存在時間300幀
    };
    
    survivalGameState.powerUps.push(powerUp);
}

// 更新生存射擊遊戲邏輯
function updateSurvival() {
    if (survivalGameState.isPaused) return;
    
    // 檢查Boss狀態並更新小怪生成許可
    checkBossStatus();
    
    // 玩家移動
    if (survivalGameState.keys['w'] || survivalGameState.keys['arrowup']) {
        survivalGameState.player.y -= survivalGameState.player.speed;
    }
    if (survivalGameState.keys['s'] || survivalGameState.keys['arrowdown']) {
        survivalGameState.player.y += survivalGameState.player.speed;
    }
    if (survivalGameState.keys['a'] || survivalGameState.keys['arrowleft']) {
        survivalGameState.player.x -= survivalGameState.player.speed;
    }
    if (survivalGameState.keys['d'] || survivalGameState.keys['arrowright']) {
        survivalGameState.player.x += survivalGameState.player.speed;
    }
    
    // 邊界檢查
    survivalGameState.player.x = Math.max(survivalGameState.player.size, 
        Math.min(survivalCanvas.width - survivalGameState.player.size, survivalGameState.player.x));
    survivalGameState.player.y = Math.max(survivalGameState.player.size, 
        Math.min(survivalCanvas.height - survivalGameState.player.size, survivalGameState.player.y));
    
    // 更新玩家角度
    survivalGameState.player.angle = Math.atan2(
        survivalGameState.mouse.y - survivalGameState.player.y,
        survivalGameState.mouse.x - survivalGameState.player.x
    );
    
    // 生成敵人和boss
    spawnSurvivalEnemy();
    spawnSurvivalBoss();
    
    // 更新子彈
    for (let i = survivalGameState.bullets.length - 1; i >= 0; i--) {
        const bullet = survivalGameState.bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        bullet.life--;
        
        // 邊界檢查
        if (bullet.x < 0 || bullet.x > survivalCanvas.width || 
            bullet.y < 0 || bullet.y > survivalCanvas.height ||
            bullet.life <= 0) {
            survivalGameState.bullets.splice(i, 1);
            continue;
        }
        
        // 檢查是否擊中小怪
        for (let j = survivalGameState.enemies.length - 1; j >= 0; j--) {
            const enemy = survivalGameState.enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.size) {
                enemy.health -= survivalGameState.player.bulletDamage;
                survivalGameState.bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    survivalGameState.score += Math.floor(enemy.size * 2);
                    survivalGameState.enemies.splice(j, 1);
                    
                    // 50%機率爆出能量塊
                    if (Math.random() < 0.5) {
                        // 隨機選擇能量塊類型
                        const types = ['damage_small', 'heal', 'max_health'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        spawnPowerUp(enemy.x, enemy.y, type);
                    }
                }
                updateSurvivalHUD();
                break;
            }
        }
        
        // 檢查是否擊中boss
        for (let j = survivalGameState.bosses.length - 1; j >= 0; j--) {
            const boss = survivalGameState.bosses[j];
            const dx = bullet.x - boss.x;
            const dy = bullet.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < boss.size) {
                boss.health -= survivalGameState.player.bulletDamage;
                survivalGameState.bullets.splice(i, 1);
                
                if (boss.health <= 0) {
                    survivalGameState.score += Math.floor(boss.size * 15); // 增加Boss擊敗分數
                    survivalGameState.bosses.splice(j, 1);
                    survivalGameState.bossAlive = false;
                    survivalGameState.lastBossDeathTime = Date.now();
                    
                    // Boss必定爆出多個能量塊
                    const dropCount = 3 + Math.floor(Math.random() * 3); // 3-5個掉落物
                    
                    for (let k = 0; k < dropCount; k++) {
                        // 計算掉落位置
                        const dropX = boss.x + (Math.random() * 100 - 50);
                        const dropY = boss.y + (Math.random() * 100 - 50);
                        
                        // 隨機選擇能量塊類型（更高機率掉落高級能量塊）
                        const types = [
                            'damage_big', // 傷害+20點
                            'max_health', // 永久生命值增加20點
                            'heal', // 回血30點
                            'damage_big', // 傷害+20點
                            'max_health', // 永久生命值增加20點
                            'damage_small' // 傷害+3點
                        ];
                        const type = types[Math.floor(Math.random() * types.length)];
                        
                        spawnPowerUp(dropX, dropY, type);
                    }
                    
                    // 顯示Boss死亡訊息
                    showEffectMessage(`Boss擊敗！5秒後恢復小怪生成`, "#FFD700");
                }
                updateSurvivalHUD();
                break;
            }
        }
        
        // 檢查玩家是否被子彈擊中（如果是Boss的子彈）
        if (bullet.isBossBullet) {
            const dx = bullet.x - survivalGameState.player.x;
            const dy = bullet.y - survivalGameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < survivalGameState.player.size + bullet.size) {
                survivalGameState.player.health -= bullet.damage || 5;
                survivalGameState.bullets.splice(i, 1);
                updateSurvivalHUD();
                
                if (survivalGameState.player.health <= 0) {
                    survivalGameOver();
                }
                continue;
            }
        }
    }
    
    // 更新能量塊
    for (let i = survivalGameState.powerUps.length - 1; i >= 0; i--) {
        const powerUp = survivalGameState.powerUps[i];
        powerUp.life--;
        
        // 檢查是否被玩家拾取
        const dx = powerUp.x - survivalGameState.player.x;
        const dy = powerUp.y - survivalGameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < survivalGameState.player.size + powerUp.size) {
            // 玩家拾取能量塊
            applyPowerUpEffect(powerUp.effect);
            survivalGameState.powerUps.splice(i, 1);
            continue;
        }
        
        // 移除過期的能量塊
        if (powerUp.life <= 0) {
            survivalGameState.powerUps.splice(i, 1);
        }
    }
    
    // 更新小怪
    for (let i = survivalGameState.enemies.length - 1; i >= 0; i--) {
        const enemy = survivalGameState.enemies[i];
        
        // 移動向玩家
        const dx = survivalGameState.player.x - enemy.x;
        const dy = survivalGameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        
        // 檢查是否碰到玩家
        if (distance < enemy.size + survivalGameState.player.size) {
            survivalGameState.player.health -= enemy.damage;
            survivalGameState.enemies.splice(i, 1);
            updateSurvivalHUD();
            
            if (survivalGameState.player.health <= 0) {
                survivalGameOver();
            }
        }
    }
    
    // 更新boss怪
    for (let i = survivalGameState.bosses.length - 1; i >= 0; i--) {
        const boss = survivalGameState.bosses[i];
        
        // 移動向玩家（速度較慢）
        const dx = survivalGameState.player.x - boss.x;
        const dy = survivalGameState.player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距離較遠，則移動向玩家
        if (distance > 200) {
            boss.x += (dx / distance) * boss.speed;
            boss.y += (dy / distance) * boss.speed;
        } else {
            // 如果距離較近，則圍繞玩家移動
            boss.x += (dy / distance) * boss.speed * 0.5; // 垂直方向移動
            boss.y -= (dx / distance) * boss.speed * 0.5; // 水平方向移動
        }
        
        // Boss射擊
        const now = Date.now();
        if (now - boss.lastShotTime > boss.shootDelay) {
            boss.lastShotTime = now;
            
            // 向玩家發射子彈
            const bulletSpeed = 4;
            const bullet = {
                x: boss.x,
                y: boss.y,
                dx: (dx / distance) * bulletSpeed,
                dy: (dy / distance) * bulletSpeed,
                size: 8,
                damage: 10,
                color: '#FF0000',
                isBossBullet: true
            };
            
            survivalGameState.bullets.push(bullet);
        }
        
        // 檢查是否碰到玩家
        if (distance < boss.size + survivalGameState.player.size) {
            survivalGameState.player.health -= boss.damage * 0.5; // 接觸傷害減半
            updateSurvivalHUD();
            
            if (survivalGameState.player.health <= 0) {
                survivalGameOver();
            }
        }
    }
}

// 應用能量塊效果
function applyPowerUpEffect(effect) {
    switch(effect.type) {
        case 'damage':
            survivalGameState.player.bulletDamage += effect.value;
            showEffectMessage(`傷害 +${effect.value}`, '#FFFFFF');
            break;
        case 'heal':
            survivalGameState.player.health = Math.min(
                survivalGameState.player.maxHealth, 
                survivalGameState.player.health + effect.value
            );
            showEffectMessage(`生命 +${effect.value}`, '#ADFF2F');
            break;
        case 'max_health':
            survivalGameState.player.maxHealth += effect.value;
            survivalGameState.player.health += effect.value;
            survivalGameState.player.permanentHealthIncrease += effect.value;
            showEffectMessage(`最大生命 +${effect.value}`, '#FFD700');
            break;
    }
    updateSurvivalHUD();
}

// 顯示效果訊息
function showEffectMessage(message, color) {
    const effectMsg = document.createElement('div');
    effectMsg.textContent = message;
    effectMsg.style.position = 'absolute';
    effectMsg.style.top = '20%';
    effectMsg.style.left = '50%';
    effectMsg.style.transform = 'translate(-50%, -50%)';
    effectMsg.style.color = color;
    effectMsg.style.fontSize = '24px';
    effectMsg.style.fontWeight = 'bold';
    effectMsg.style.textShadow = '0 0 5px #000000';
    effectMsg.style.zIndex = '1000';
    effectMsg.style.pointerEvents = 'none';
    effectMsg.style.animation = 'floatUp 1.5s ease-out';
    
    document.getElementById('survivalGameScreen').appendChild(effectMsg);
    
    // 1.5秒後移除
    setTimeout(() => {
        if (effectMsg.parentNode) {
            effectMsg.parentNode.removeChild(effectMsg);
        }
    }, 1500);
}

// 射擊
function shootSurvival() {
    if (survivalGameState.isPaused) return;
    
    const now = Date.now();
    if (now - survivalGameState.lastShot < survivalGameState.shotDelay) return;
    
    // 子彈無限，不需要檢查彈藥
    survivalGameState.lastShot = now;
    
    // 計算射擊角度
    const angle = Math.atan2(
        survivalGameState.mouse.y - survivalGameState.player.y,
        survivalGameState.mouse.x - survivalGameState.player.x
    );
    
    // 創建子彈
    survivalGameState.bullets.push({
        x: survivalGameState.player.x,
        y: survivalGameState.player.y,
        dx: Math.cos(angle) * 10,
        dy: Math.sin(angle) * 10,
        size: 5,
        life: 100
    });
}

// 裝填彈藥 - 修改為不需要裝填
function reloadSurvival() {
    // 子彈無限，不需要裝填
    return;
}

// 暫停/繼續遊戲
function toggleSurvivalPause() {
    if (survivalGameState.currentScreen !== 'game') return;
    
    survivalGameState.isPaused = !survivalGameState.isPaused;
    
    if (survivalGameState.isPaused) {
        document.getElementById('survivalPauseScreen').style.display = 'flex';
        cancelAnimationFrame(survivalGameState.gameLoopId);
    } else {
        document.getElementById('survivalPauseScreen').style.display = 'none';
        survivalGameLoop();
    }
}

// 生存射擊遊戲循環
function survivalGameLoop() {
    if (survivalGameState.currentScreen !== 'game' || survivalGameState.isPaused) return;
    
    updateSurvival();
    drawSurvival();
    
    survivalGameState.gameLoopId = requestAnimationFrame(survivalGameLoop);
}

// 繪製生存射擊遊戲
function drawSurvival() {
    // 清空畫布
    survivalCtx.fillStyle = '#2a2a2a';
    survivalCtx.fillRect(0, 0, survivalCanvas.width, survivalCanvas.height);
    
    // 繪製背景網格
    drawSurvivalGrid();
    
    // 繪製子彈
    survivalCtx.fillStyle = '#FFD700';
    survivalGameState.bullets.forEach(bullet => {
        survivalCtx.beginPath();
        survivalCtx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        survivalCtx.fill();
        
        // 如果是Boss子彈，添加特效
        if (bullet.isBossBullet) {
            survivalCtx.fillStyle = '#FF0000';
            survivalCtx.beginPath();
            survivalCtx.arc(bullet.x, bullet.y, bullet.size + 2, 0, Math.PI * 2);
            survivalCtx.fill();
            survivalCtx.fillStyle = '#FFD700';
        }
    });
    
    // 繪製小怪
    survivalGameState.enemies.forEach(enemy => {
        survivalCtx.fillStyle = enemy.color;
        survivalCtx.beginPath();
        survivalCtx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        survivalCtx.fill();
        
        // 敵人生命值條
        drawHealthBar(enemy.x, enemy.y, enemy.size, enemy.health, enemy.maxHealth);
    });
    
    // 繪製boss怪 - 修改為使用圖片
    survivalGameState.bosses.forEach(boss => {
        // 使用圖片或繪製的Boss
        if (bossImageLoaded && bossImage) {
            // 計算Boss的旋轉角度（使其面向玩家）
            const dx = survivalGameState.player.x - boss.x;
            const dy = survivalGameState.player.y - boss.y;
            const angle = Math.atan2(dy, dx);
            
            // 保存畫布狀態
            survivalCtx.save();
            
            // 移動到Boss位置並旋轉
            survivalCtx.translate(boss.x, boss.y);
            survivalCtx.rotate(angle);
            
            // 繪製Boss圖片
            survivalCtx.drawImage(
                bossImage, 
                -boss.size, // x偏移
                -boss.size, // y偏移
                boss.size * 2, // 寬度
                boss.size * 2 // 高度
            );
            
            // 恢復畫布狀態
            survivalCtx.restore();
        } else {
            // 備用：繪製機械風格Boss
            drawFallbackBoss(survivalCtx, boss.x, boss.y, boss.size);
        }
        
        // boss生命值條（更大更明顯）
        drawBossHealthBar(boss.x, boss.y, boss.size, boss.health, boss.maxHealth);
        
        // boss標記
        survivalCtx.fillStyle = '#FFFFFF';
        survivalCtx.font = 'bold 20px Arial';
        survivalCtx.textAlign = 'center';
        survivalCtx.textBaseline = 'middle';
        survivalCtx.fillText('BOSS', boss.x, boss.y - boss.size - 30);
    });
    
    // 繪製能量塊
    survivalGameState.powerUps.forEach(powerUp => {
        // 能量塊本體
        survivalCtx.fillStyle = powerUp.color;
        survivalCtx.fillRect(
            powerUp.x - powerUp.size/2, 
            powerUp.y - powerUp.size/2, 
            powerUp.size, 
            powerUp.size
        );
        
        // 能量塊閃爍效果
        if (Math.sin(Date.now() / 200) > 0) {
            survivalCtx.strokeStyle = '#FFFFFF';
            survivalCtx.lineWidth = 2;
            survivalCtx.strokeRect(
                powerUp.x - powerUp.size/2 - 2, 
                powerUp.y - powerUp.size/2 - 2, 
                powerUp.size + 4, 
                powerUp.size + 4
            );
        }
    });
    
    // 繪製玩家
    drawSurvivalPlayer();
    
    // 繪製準星
    drawSurvivalCrosshair();
}

// 繪製網格背景
function drawSurvivalGrid() {
    survivalCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    survivalCtx.lineWidth = 1;
    
    const gridSize = 50;
    
    // 垂直線
    for (let x = 0; x < survivalCanvas.width; x += gridSize) {
        survivalCtx.beginPath();
        survivalCtx.moveTo(x, 0);
        survivalCtx.lineTo(x, survivalCanvas.height);
        survivalCtx.stroke();
    }
    
    // 水平線
    for (let y = 0; y < survivalCanvas.height; y += gridSize) {
        survivalCtx.beginPath();
        survivalCtx.moveTo(0, y);
        survivalCtx.lineTo(survivalCanvas.width, y);
        survivalCtx.stroke();
    }
}

// 繪製玩家
function drawSurvivalPlayer() {
    // 玩家身體
    survivalCtx.fillStyle = '#4CAF50';
    survivalCtx.beginPath();
    survivalCtx.arc(survivalGameState.player.x, survivalGameState.player.y, 
           survivalGameState.player.size, 0, Math.PI * 2);
    survivalCtx.fill();
    
    // 玩家武器（指向滑鼠）
    survivalCtx.strokeStyle = '#795548';
    survivalCtx.lineWidth = 8;
    survivalCtx.beginPath();
    survivalCtx.moveTo(survivalGameState.player.x, survivalGameState.player.y);
    survivalCtx.lineTo(
        survivalGameState.player.x + Math.cos(survivalGameState.player.angle) * 30,
        survivalGameState.player.y + Math.sin(survivalGameState.player.angle) * 30
    );
    survivalCtx.stroke();
    
    // 玩家生命值條
    survivalCtx.fillStyle = '#f44336';
    survivalCtx.fillRect(survivalGameState.player.x - survivalGameState.player.size, 
                survivalGameState.player.y - survivalGameState.player.size - 15, 
                survivalGameState.player.size * 2, 8);
    survivalCtx.fillStyle = '#4CAF50';
    const healthPercent = survivalGameState.player.health / survivalGameState.player.maxHealth;
    survivalCtx.fillRect(survivalGameState.player.x - survivalGameState.player.size, 
                survivalGameState.player.y - survivalGameState.player.size - 15, 
                healthPercent * survivalGameState.player.size * 2, 8);
}

// 繪製boss生命值條
function drawBossHealthBar(x, y, size, health, maxHealth) {
    const barWidth = size * 2;
    const barHeight = 15;
    const barX = x - barWidth / 2;
    const barY = y - size - 20;
    
    // 背景
    survivalCtx.fillStyle = '#333333';
    survivalCtx.fillRect(barX, barY, barWidth, barHeight);
    
    // 血量
    const healthPercent = health / maxHealth;
    survivalCtx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FF9800' : '#F44336';
    survivalCtx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // 邊框
    survivalCtx.strokeStyle = '#FFFFFF';
    survivalCtx.lineWidth = 2;
    survivalCtx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 血量文字
    survivalCtx.fillStyle = '#FFFFFF';
    survivalCtx.font = 'bold 12px Arial';
    survivalCtx.textAlign = 'center';
    survivalCtx.fillText(`${health}/${maxHealth}`, x, barY + barHeight/2 + 4);
}

// 繪製一般生命值條
function drawHealthBar(x, y, size, health, maxHealth) {
    const barWidth = size * 1.5;
    const barHeight = 5;
    const barX = x - barWidth / 2;
    const barY = y - size - 8;
    
    // 背景
    survivalCtx.fillStyle = '#333333';
    survivalCtx.fillRect(barX, barY, barWidth, barHeight);
    
    // 血量
    const healthPercent = health / maxHealth;
    survivalCtx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FF9800' : '#F44336';
    survivalCtx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

// 繪製準星
function drawSurvivalCrosshair() {
    const size = 15;
    const thickness = 2;
    
    survivalCtx.strokeStyle = survivalGameState.reloading ? '#FF9800' : '#00FF00';
    survivalCtx.lineWidth = thickness;
    
    // 水平線
    survivalCtx.beginPath();
    survivalCtx.moveTo(survivalGameState.mouse.x - size, survivalGameState.mouse.y);
    survivalCtx.lineTo(survivalGameState.mouse.x + size, survivalGameState.mouse.y);
    survivalCtx.stroke();
    
    // 垂直線
    survivalCtx.beginPath();
    survivalCtx.moveTo(survivalGameState.mouse.x, survivalGameState.mouse.y - size);
    survivalCtx.lineTo(survivalGameState.mouse.x, survivalGameState.mouse.y + size);
    survivalCtx.stroke();
    
    // 中心點
    survivalCtx.fillStyle = survivalGameState.reloading ? '#FF9800' : '#FF0000';
    survivalCtx.beginPath();
    survivalCtx.arc(survivalGameState.mouse.x, survivalGameState.mouse.y, 2, 0, Math.PI * 2);
    survivalCtx.fill();
    
    // 如果是裝填中，顯示裝填動畫
    if (survivalGameState.reloading) {
        survivalCtx.beginPath();
        survivalCtx.arc(survivalGameState.mouse.x, survivalGameState.mouse.y, size + 5, 0, Math.PI * 2);
        survivalCtx.strokeStyle = '#FF9800';
        survivalCtx.lineWidth = 3;
        survivalCtx.stroke();
    }
}

// 生存射擊遊戲結束
function survivalGameOver() {
    survivalGameState.currentScreen = 'gameOver';
    cancelAnimationFrame(survivalGameState.gameLoopId);
    document.getElementById('survivalScore').textContent = `分數: ${survivalGameState.score}`;
    document.getElementById('survivalGameOver').style.display = 'flex';
}

// ========== 原有遊戲程式 ==========

// 創建科技感光點
function createTechDots() {
    const techDots = document.getElementById('techDots');
    const dotCount = 50;
    
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'tech-dot';
        
        // 隨機位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
        
        // 隨機動畫延遲
        const delay = Math.random() * 3;
        dot.style.animationDelay = `${delay}s`;
        
        techDots.appendChild(dot);
    }
}

// 調整畫布大小
function resizeCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
}

// 設置事件監聽器
function setupEventListeners() {
    // 開始按鈕
    document.getElementById('startButton').addEventListener('click', showGameSelectionScreen);
    
    // 遊戲選擇界面標籤
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 如果點擊的是返回標籤，直接返回主畫面
            if (this.id === 'backToMainTab') {
                showMainScreen();
                return;
            }
            
            // 移除所有標籤的active類
            document.querySelectorAll('.category-tab').forEach(t => {
                t.classList.remove('active');
            });
            // 添加active類到當前標籤
            this.classList.add('active');
            // 更新內容顯示
            updateContentDisplay(this.dataset.category);
        });
    });
    
    // 難度選擇按鈕
    document.getElementById('easyButton').addEventListener('click', () => startGame(Difficulty.EASY));
    document.getElementById('normalButton').addEventListener('click', () => startGame(Difficulty.NORMAL));
    document.getElementById('hardButton').addEventListener('click', () => startGame(Difficulty.HARD));
    document.getElementById('randomButton').addEventListener('click', startRandomGame);
    document.getElementById('exitButton').addEventListener('click', showGameSelectionScreen);
    document.getElementById('resumeButton').addEventListener('click', resumeGame);
    
    // 歷史記錄按鈕
    document.getElementById('historyButton').addEventListener('click', showHistory);
    document.getElementById('closeHistory').addEventListener('click', hideHistory);
    
    // 遊戲結束繼續按鈕 - 修改為返回難度選擇頁面
    document.getElementById('continueButton').addEventListener('click', function() {
        document.getElementById('gameOverMessage').style.display = 'none';
        showDifficultyScreen();
    });
    
    // 鍵盤控制
    document.addEventListener('keydown', handleKeyDown);
    
    // 滑鼠移動
    document.addEventListener('mousemove', updateCrosshair);
    
    // 滑鼠點擊
    document.addEventListener('click', handleClick);
    
    // 檔案總管關閉按鈕
    document.getElementById('closeFileExplorer').addEventListener('click', hideFileExplorer);
    
    // 檔案上傳按鈕
    document.getElementById('fileUploadButton').addEventListener('click', function() {
        document.getElementById('backgroundImageInput').click();
    });
    
    // 檔案選擇事件
    document.getElementById('backgroundImageInput').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            selectedBackgroundFile = e.target.files[0];
            document.getElementById('selectedFileInfo').textContent = selectedBackgroundFile.name;
            document.getElementById('applyBackgroundButton').style.display = 'block';
        }
    });
    
    // 套用背景按鈕
    document.getElementById('applyBackgroundButton').addEventListener('click', applyBackground);
}

// 顯示遊戲選擇界面
function showGameSelectionScreen() {
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('gameSelectionScreen').classList.remove('hidden');
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('resumeButton').style.display = 'none';
    document.getElementById('gameOverMessage').style.display = 'none';
    hideHistory(); // 確保歷史記錄彈窗關閉
    hideFileExplorer(); // 確保檔案總管關閉
    hideSurvivalGame(); // 確保生存射擊遊戲關閉
    
    // 初始化內容顯示
    updateContentDisplay('all');
    
    currentState = GameState.GAME_SELECTION;
}

// 更新內容顯示
function updateContentDisplay(category) {
    const contentDisplay = document.getElementById('contentDisplay');
    contentDisplay.innerHTML = '';
    
    if (category === 'settings') {
        // 顯示設定內容
        const languageSection = document.createElement('div');
        languageSection.className = 'language-section';
        
        const languageLabel = document.createElement('div');
        languageLabel.className = 'language-label';
        languageLabel.textContent = languageData[currentLanguage].languageSwitch;
        
        const languageSelector = document.createElement('div');
        languageSelector.className = 'language-selector';
        
        const languageDisplay = document.createElement('div');
        languageDisplay.className = 'language-display';
        languageDisplay.innerHTML = `
            <span>${languageData['zh-TW'].chineseTraditional}</span>
            <span class="language-arrow">▼</span>
        `;
        
        const languageOptions = document.createElement('div');
        languageOptions.className = 'language-options';
        
        // 添加語言選項 - 只保留三種語言
        const languages = [
            { code: 'zh-TW', name: languageData['zh-TW'].chineseTraditional },
            { code: 'zh-CN', name: languageData['zh-TW'].chineseSimplified },
            { code: 'en', name: languageData['zh-TW'].english }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'language-option';
            option.textContent = lang.name;
            option.dataset.lang = lang.code;
            option.addEventListener('click', function() {
                changeLanguage(this.dataset.lang);
                languageSelector.classList.remove('open');
            });
            languageOptions.appendChild(option);
        });
        
        languageDisplay.addEventListener('click', function() {
            languageSelector.classList.toggle('open');
        });
        
        languageSelector.appendChild(languageDisplay);
        languageSelector.appendChild(languageOptions);
        languageSection.appendChild(languageLabel);
        languageSection.appendChild(languageSelector);
        contentDisplay.appendChild(languageSection);
        
        // 背景更換部分 - 修改為正方形按鈕
        const backgroundSection = document.createElement('div');
        backgroundSection.className = 'background-change-section';
        
        const backgroundLabel = document.createElement('div');
        backgroundLabel.className = 'background-change-label';
        backgroundLabel.textContent = languageData[currentLanguage].backgroundChange;
        
        // 更改圖片按鈕（正方形）
        const changeButton = document.createElement('div');
        changeButton.className = 'background-change-button';
        changeButton.id = 'changeBackgroundButton';
        changeButton.innerHTML = `
            <div class="button-text-top">${languageData[currentLanguage].changeImageTop}</div>
            <div class="button-text-bottom">${languageData[currentLanguage].changeImageBottom}</div>
        `;
        
        changeButton.addEventListener('click', showFileExplorer);
        
        // 重置背景按鈕（正方形）
        const resetButton = document.createElement('div');
        resetButton.className = 'background-change-button';
        resetButton.id = 'resetBackgroundButton';
        resetButton.innerHTML = `
            <div class="button-text-top">${languageData[currentLanguage].resetBackgroundTop}</div>
            <div class="button-text-bottom">${languageData[currentLanguage].resetBackgroundBottom}</div>
        `;
        
        resetButton.addEventListener('click', resetBackground);
        
        backgroundSection.appendChild(backgroundLabel);
        backgroundSection.appendChild(changeButton);
        backgroundSection.appendChild(resetButton);
        contentDisplay.appendChild(backgroundSection);
        
    } else {
        // 顯示遊戲內容
        const gameList = games[category] || [];
        
        if (gameList.length === 0) {
            const noGames = document.createElement('div');
            noGames.className = 'no-games';
            noGames.textContent = languageData[currentLanguage].noGames;
            contentDisplay.appendChild(noGames);
        } else {
            gameList.forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'game-item';
                gameItem.innerHTML = `<h3>${game.name}</h3>`;
                gameItem.addEventListener('click', () => {
                    if (game.id === 'birdShooting') {
                        currentGameId = game.id;
                        showDifficultyScreen();
                    } else if (game.id === 'survive') {
                        // 顯示生存射擊遊戲
                        showSurvivalGame();
                    }
                });
                contentDisplay.appendChild(gameItem);
            });
        }
    }
}

// 顯示檔案總管
function showFileExplorer() {
    document.getElementById('fileExplorerModal').style.display = 'flex';
    // 更新語言
    updateFileExplorerLanguage();
}

// 隱藏檔案總管
function hideFileExplorer() {
    document.getElementById('fileExplorerModal').style.display = 'none';
    // 重置檔案選擇
    document.getElementById('backgroundImageInput').value = '';
    document.getElementById('selectedFileInfo').textContent = languageData[currentLanguage].noFileSelected;
    document.getElementById('applyBackgroundButton').style.display = 'none';
    selectedBackgroundFile = null;
}

// 更新檔案總管語言
function updateFileExplorerLanguage() {
    const data = languageData[currentLanguage];
    document.getElementById('fileExplorerTitle').textContent = data.fileExplorerTitle;
    document.getElementById('fileUploadButton').textContent = data.selectFile;
    document.getElementById('selectedFileInfo').textContent = data.noFileSelected;
    document.getElementById('applyBackgroundButton').textContent = data.applyBackground;
}

// 套用背景圖片
function applyBackground() {
    if (!selectedBackgroundFile) {
        alert('請先選擇圖片檔案');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // 保存到localStorage
        localStorage.setItem('customBackground', imageData);
        
        // 套用背景
        applyBackgroundToScreens(imageData);
        
        // 關閉檔案總管
        hideFileExplorer();
        
        alert('背景已成功更改！');
    };
    
    reader.readAsDataURL(selectedBackgroundFile);
}

// 套用背景到畫面
function applyBackgroundToScreens(imageData) {
    // 套用到主畫面
    const mainScreen = document.getElementById('mainScreen');
    mainScreen.style.setProperty('--custom-background', `url('${imageData}')`);
    mainScreen.classList.add('custom-bg');
    
    // 套用到遊戲選擇畫面
    const gameSelectionScreen = document.getElementById('gameSelectionScreen');
    gameSelectionScreen.style.setProperty('--custom-background', `url('${imageData}')`);
    gameSelectionScreen.classList.add('custom-bg');
}

// 載入背景圖片
function loadBackgroundImage() {
    const savedBackground = localStorage.getItem('customBackground');
    if (savedBackground) {
        applyBackgroundToScreens(savedBackground);
    }
}

// 重置背景
function resetBackground() {
    // 移除localStorage中的背景
    localStorage.removeItem('customBackground');
    
    // 移除自訂背景類
    const mainScreen = document.getElementById('mainScreen');
    mainScreen.classList.remove('custom-bg');
    mainScreen.style.removeProperty('--custom-background');
    
    const gameSelectionScreen = document.getElementById('gameSelectionScreen');
    gameSelectionScreen.classList.remove('custom-bg');
    gameSelectionScreen.style.removeProperty('--custom-background');
    
    alert('背景已重置為預設值');
}

// 更改語言
function changeLanguage(lang) {
    currentLanguage = lang;
    const data = languageData[lang];
    
    // 更新主界面
    document.querySelector('#mainScreen .title').textContent = data.title;
    document.getElementById('startButton').textContent = data.startButton;
    document.querySelector('#mainScreen .instructions').textContent = data.instructions;
    
    // 更新游戏选择界面
    document.querySelector('[data-category="all"]').textContent = data.allGames;
    document.querySelector('[data-category="shooting"]').textContent = data.shootingGames;
    document.querySelector('[data-category="driving"]').textContent = data.drivingGames;
    document.querySelector('[data-category="card"]').textContent = data.cardGames;
    document.querySelector('[data-category="action"]').textContent = data.actionGames;
    document.querySelector('[data-category="settings"]').textContent = data.settings;
    document.getElementById('backToMainTab').textContent = data.backToMain;
    
    // 更新难度选择界面
    document.querySelector('#difficultyScreen .title').textContent = data.selectDifficulty;
    document.getElementById('easyButton').textContent = data.easy;
    document.getElementById('normalButton').textContent = data.normal;
    document.getElementById('hardButton').textContent = data.hard;
    document.getElementById('randomButton').textContent = data.random;
    document.getElementById('exitButton').textContent = data.exit;
    document.getElementById('resumeButton').textContent = data.resume;
    document.getElementById('historyButton').textContent = data.history;
    document.querySelector('#difficultyScreen .instructions').textContent = data.pauseInstructions;
    
    // 更新游戏界面
    document.getElementById('score').textContent = `${data.score}: 0`;
    document.getElementById('birdsLeft').textContent = `${data.birdsLeft}: 0`;
    document.getElementById('timeLeft').textContent = `${data.timeLeft}: 40秒`;
    document.querySelector('#gameOverMessage h2').textContent = data.gameOver;
    document.querySelector('#gameOverMessage p').textContent = `${data.yourScore}: `;
    document.getElementById('continueButton').textContent = data.continue;
    
    // 更新历史记录
    document.getElementById('historyTitle').textContent = data.historyTitle;
    document.querySelector('.noHistory').textContent = data.noHistory;
    
    // 更新设置界面
    if (document.querySelector('.language-label')) {
        document.querySelector('.language-label').textContent = data.languageSwitch;
    }
    
    // 更新背景更換按鈕
    const changeButton = document.getElementById('changeBackgroundButton');
    if (changeButton) {
        changeButton.innerHTML = `
            <div class="button-text-top">${data.changeImageTop}</div>
            <div class="button-text-bottom">${data.changeImageBottom}</div>
        `;
    }
    
    const resetButton = document.getElementById('resetBackgroundButton');
    if (resetButton) {
        resetButton.innerHTML = `
            <div class="button-text-top">${data.resetBackgroundTop}</div>
            <div class="button-text-bottom">${data.resetBackgroundBottom}</div>
        `;
    }
    
    // 更新背景更換標籤
    const backgroundLabel = document.querySelector('.background-change-label');
    if (backgroundLabel) {
        backgroundLabel.textContent = data.backgroundChange;
    }
    
    // 更新档案总管
    updateFileExplorerLanguage();
    
    // 更新游戏项目
    updateContentDisplay(document.querySelector('.category-tab.active').dataset.category);
}

// 顯示歷史記錄
function showHistory() {
    document.getElementById('historyPopup').style.display = 'flex';
    updateHistoryDisplay();
}

// 隱藏歷史記錄
function hideHistory() {
    document.getElementById('historyPopup').style.display = 'none';
}

// 更新歷史記錄顯示
function updateHistoryDisplay() {
    const historyContent = document.getElementById('historyContent');
    
    if (gameHistory.length === 0) {
        historyContent.innerHTML = `<div class="noHistory">${languageData[currentLanguage].noHistory}</div>`;
        return;
    }
    
    let historyHTML = '';
    gameHistory.forEach((record, index) => {
        historyHTML += `
            <div class="historyItem">
                <div class="historyDetails">
                    <div>${record.date}</div>
                    <div>${languageData[currentLanguage].difficulty || '難度'}: ${record.difficulty}</div>
                    <div>遊戲: ${record.game}</div>
                </div>
                <div class="historyScore">${record.score} ${languageData[currentLanguage].score}</div>
            </div>
        `;
    });
    
    historyContent.innerHTML = historyHTML;
}

// 保存歷史記錄到localStorage
function saveHistory() {
    localStorage.setItem('birdShootingGameHistory', JSON.stringify(gameHistory));
}

// 從localStorage加載歷史記錄
function loadHistory() {
    const savedHistory = localStorage.getItem('birdShootingGameHistory');
    if (savedHistory) {
        gameHistory = JSON.parse(savedHistory);
    }
}

// 添加新的歷史記錄
function addHistoryRecord(score, difficulty, game) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 將新記錄添加到開頭
    gameHistory.unshift({
        date: dateStr,
        score: score,
        difficulty: difficulty,
        game: game
    });
    
    // 只保留最近的50條記錄
    if (gameHistory.length > 50) {
        gameHistory = gameHistory.slice(0, 50);
    }
    
    // 保存到localStorage
    saveHistory();
    
    // 更新顯示
    updateHistoryDisplay();
}

// 顯示難度選擇畫面
function showDifficultyScreen() {
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('gameSelectionScreen').classList.add('hidden');
    document.getElementById('difficultyScreen').classList.remove('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('resumeButton').style.display = 'none';
    document.getElementById('gameOverMessage').style.display = 'none';
    hideHistory(); // 確保歷史記錄彈窗關閉
    hideFileExplorer(); // 確保檔案總管關閉
    hideSurvivalGame(); // 確保生存射擊遊戲關閉
    currentState = GameState.DIFFICULTY_SELECT;
}

// 顯示主畫面
function showMainScreen() {
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameSelectionScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    hideHistory(); // 確保歷史記錄彈窗關閉
    hideFileExplorer(); // 確保檔案總管關閉
    hideSurvivalGame(); // 確保生存射擊遊戲關閉
    currentState = GameState.MAIN_MENU;
}

// 開始遊戲
function startGame(difficulty) {
    currentDifficulty = difficulty;
    score = 0;
    birds = [];
    bombs = []; // 重置炸彈
    birdsSpawned = 0;
    birdsKilled = 0;
    birdsEscaped = 0; // 重置逃脫的飛鳥數量
    lastSpawnTime = 0;
    lastBombSpawnTime = 0; // 重置炸彈生成時間
    bombSpawnInterval = 0; // 重置炸彈生成間隔
    
    // 檢查是否為隨機模式
    isRandomMode = currentDifficulty.name === "隨機";
    
    // 如果是隨機模式，初始化計時器
    if (isRandomMode) {
        gameStartTime = Date.now();
        document.getElementById('timeLeft').style.display = 'block';
        document.getElementById('birdsLeft').style.display = 'none';
        updateTimeLeft();
        
        // 設置計時器
        if (gameTimer) clearInterval(gameTimer);
        gameTimer = setInterval(updateTimeLeft, 100);
    } else {
        // 非隨機模式，顯示剩餘飛鳥
        document.getElementById('birdsLeft').style.display = 'block';
        document.getElementById('timeLeft').style.display = 'none';
    }
    
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('gameOverMessage').style.display = 'none';
    crosshair.style.display = 'block';
    
    updateScore();
    updateBirdsLeft();
    
    currentState = GameState.PLAYING;
}

// 更新剩餘時間（隨機模式專用）
function updateTimeLeft() {
    if (!isRandomMode || currentState !== GameState.PLAYING) return;
    
    const elapsed = Date.now() - gameStartTime;
    const timeLeft = Math.max(0, currentDifficulty.timeLimit - elapsed);
    const secondsLeft = Math.ceil(timeLeft / 1000);
    
    document.getElementById('timeLeft').textContent = 
        `${languageData[currentLanguage].timeLeft}: ${secondsLeft}秒`;
    
    // 檢查時間是否結束
    if (timeLeft <= 0) {
        endGame();
    }
}

// 開始隨機難度遊戲
function startRandomGame() {
    startGame(Difficulty.RANDOM);
}

// 繼續遊戲
function resumeGame() {
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('resumeButton').style.display = 'none';
    crosshair.style.display = 'block';
    currentState = GameState.PLAYING;
    
    // 如果是隨機模式，重新開始計時器
    if (isRandomMode) {
        gameTimer = setInterval(updateTimeLeft, 100);
    }
}

// 暫停遊戲
function pauseGame() {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('difficultyScreen').classList.remove('hidden');
    document.getElementById('resumeButton').style.display = 'block';
    crosshair.style.display = 'none';
    currentState = GameState.PAUSED;
    
    // 如果是隨機模式，暫停計時器
    if (isRandomMode && gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// 處理鍵盤輸入
function handleKeyDown(e) {
    switch(e.code) {
        case 'Space':
            if (currentState === GameState.MAIN_MENU) {
                showGameSelectionScreen();
            }
            break;
        case 'Escape':
            if (currentState === GameState.PLAYING) {
                pauseGame();
            }
            break;
    }
}

// 更新準星位置
function updateCrosshair(e) {
    crosshair.style.left = (e.clientX - 20) + 'px';
    crosshair.style.top = (e.clientY - 20) + 'px';
}

// 處理點擊事件 - 新增炸彈點擊檢測
function handleClick(e) {
    if (currentState !== GameState.PLAYING) return;
    
    const clickRadius = 30; // 點擊範圍為圓圈的1.5倍
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 先檢查是否點擊到炸彈（炸彈優先級高）
    for (let i = bombs.length - 1; i >= 0; i--) {
        const bomb = bombs[i];
        const distance = Math.sqrt(
            Math.pow(mouseX - bomb.x, 2) + Math.pow(mouseY - bomb.y, 2)
        );
        
        if (distance < bomb.width/2 + 10) { // 炸彈點擊範圍稍大
            // 點擊到炸彈，扣分
            bombs.splice(i, 1);
            score = Math.max(0, score - bomb.penalty); // 分數不會低於0
            
            // 顯示扣分動畫
            showPenaltyAnimation(mouseX, mouseY, bomb.penalty);
            
            updateScore();
            return; // 點到炸彈後就不檢查飛鳥了
        }
    }
    
    // 檢查是否點擊到飛鳥
    for (let i = birds.length - 1; i >= 0; i--) {
        const bird = birds[i];
        const distance = Math.sqrt(
            Math.pow(mouseX - bird.x, 2) + Math.pow(mouseY - bird.y, 2)
        );
        
        if (distance < clickRadius) {
            // 擊中飛鳥
            birds.splice(i, 1);
            birdsKilled++;
            score += 10;
            updateScore();
            updateBirdsLeft();
            break;
        }
    }
}

// 顯示扣分動畫
function showPenaltyAnimation(x, y, penalty) {
    const penaltyText = document.createElement('div');
    penaltyText.textContent = `-${penalty}`;
    penaltyText.style.position = 'absolute';
    penaltyText.style.left = x + 'px';
    penaltyText.style.top = y + 'px';
    penaltyText.style.color = '#FF0000';
    penaltyText.style.fontSize = '24px';
    penaltyText.style.fontWeight = 'bold';
    penaltyText.style.textShadow = '0 0 5px #FFFFFF';
    penaltyText.style.pointerEvents = 'none';
    penaltyText.style.zIndex = '1001';
    penaltyText.style.transition = 'all 0.8s ease-out';
    
    document.getElementById('gameContainer').appendChild(penaltyText);
    
    // 動畫效果
    setTimeout(() => {
        penaltyText.style.transform = 'translateY(-50px)';
        penaltyText.style.opacity = '0';
    }, 10);
    
    // 移除元素
    setTimeout(() => {
        if (penaltyText.parentNode) {
            penaltyText.parentNode.removeChild(penaltyText);
        }
    }, 900);
}

// 更新分數顯示
function updateScore() {
    document.getElementById('score').textContent = `${languageData[currentLanguage].score}: ${score}`;
}

// 更新剩餘飛鳥顯示
function updateBirdsLeft() {
    if (isRandomMode) return; // 隨機模式不顯示剩餘飛鳥
    
    const birdsRemaining = currentDifficulty.birds - birdsKilled - birdsEscaped;
    document.getElementById('birdsLeft').textContent = `${languageData[currentLanguage].birdsLeft}: ${birdsRemaining}`;
}

// 生成飛鳥
function spawnBird() {
    const now = Date.now();
    
    // 隨機模式：使用1~4.5秒隨機生成
    if (isRandomMode) {
        if (now - lastSpawnTime > getRandomSpawnTimeForRandomMode()) {
            createBird();
            lastSpawnTime = now;
        }
    } 
    // 其他模式：按照原來的邏輯生成
    else if (birdsSpawned < currentDifficulty.birds && 
        now - lastSpawnTime > getRandomSpawnTime()) {
        createBird();
        lastSpawnTime = now;
        updateBirdsLeft();
    }
}

// 創建飛鳥（共用函數）
function createBird() {
    // 隨機決定從左邊還是右邊生成
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -50 : gameCanvas.width + 50;
    const y = Math.random() * (gameCanvas.height - 100) + 50;
    
    // 飛鳥屬性
    const bird = {
        x: x,
        y: y,
        width: 60,
        height: 30,
        speed: currentDifficulty.speed * (fromLeft ? 1 : -1),
        color: getRandomColor(),
        fromLeft: fromLeft
    };
    
    birds.push(bird);
    birdsSpawned++;
}

// 生成炸彈 - 修改隨機模式的炸彈生成邏輯
function spawnBomb() {
    if (!currentDifficulty.hasBombs) return;
    
    const now = Date.now();
    if (now - lastBombSpawnTime > bombSpawnInterval) {
        // 隨機決定從左邊還是右邊生成
        const fromLeft = Math.random() > 0.5;
        const x = fromLeft ? -50 : gameCanvas.width + 50;
        const y = Math.random() * (gameCanvas.height - 100) + 50;
        
        // 炸彈屬性
        let bombSize, bombWidth, bombHeight, bombPenalty;
        
        if (currentDifficulty.name === "隨機") {
            // 隨機模式使用自定義大小：直徑1、1.5、2倍
            const sizeIndex = Math.floor(Math.random() * 3); // 0, 1, 2
            bombWidth = currentDifficulty.bombSizes[sizeIndex];
            bombHeight = currentDifficulty.bombSizes[sizeIndex];
            bombPenalty = currentDifficulty.bombPenalties[sizeIndex];
            
            // 設定炸彈大小名稱
            if (bombWidth === 20) {
                bombSize = "small";
            } else if (bombWidth === 30) {
                bombSize = "medium";
            } else {
                bombSize = "large";
            }
        } else {
            // 一般和困難模式保持原有大小
            bombSize = "medium";
            bombWidth = currentDifficulty.bombSize;
            bombHeight = currentDifficulty.bombSize;
            bombPenalty = currentDifficulty.bombPenalty;
        }
        
        const bomb = {
            x: x,
            y: y,
            width: bombWidth,
            height: bombHeight,
            size: bombSize,
            speed: currentDifficulty.speed * (fromLeft ? 1 : -1),
            penalty: bombPenalty,
            fromLeft: fromLeft,
            rotation: 0,
            rotationSpeed: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1) // 旋轉速度
        };
        
        bombs.push(bomb);
        
        // 設置下一次生成的時間間隔
        bombSpawnInterval = Math.random() * 
            (currentDifficulty.bombSpawnMax - currentDifficulty.bombSpawnMin) + 
            currentDifficulty.bombSpawnMin;
        
        lastBombSpawnTime = now;
    }
}

// 獲取隨機生成時間（非隨機模式）
function getRandomSpawnTime() {
    return Math.random() * 
        (currentDifficulty.spawnMax - currentDifficulty.spawnMin) + 
        currentDifficulty.spawnMin;
}

// 獲取隨機生成時間（隨機模式專用：1~4.5秒）
function getRandomSpawnTimeForRandomMode() {
    return Math.random() * (4500 - 1000) + 1000; // 1000ms to 4500ms (1-4.5秒)
}

// 獲取隨機顏色
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#6A0572', 
        '#1A936F', '#114B5F', '#F9C80E', '#EA3546'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 更新飛鳥位置
function updateBirds() {
    for (let i = birds.length - 1; i >= 0; i--) {
        const bird = birds[i];
        bird.x += bird.speed;
        
        // 檢查是否飛出畫面
        const birdWidth = bird.width;
        if ((bird.fromLeft && bird.x > gameCanvas.width + birdWidth/2) || 
            (!bird.fromLeft && bird.x < -birdWidth/2)) {
            // 飛鳥飛出畫面，移除並增加逃脫計數
            birds.splice(i, 1);
            birdsEscaped++;
            updateBirdsLeft();
        }
    }
    
    // 檢查遊戲是否結束
    if (isRandomMode) {
        // 隨機模式：只檢查時間，時間到時在updateTimeLeft中結束遊戲
        return;
    } else {
        // 其他模式：所有飛鳥都生成完畢且所有飛鳥都消失
        if (birdsSpawned >= currentDifficulty.birds && birds.length === 0) {
            endGame();
        }
    }
}

// 更新炸彈位置
function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        const bomb = bombs[i];
        bomb.x += bomb.speed;
        bomb.rotation += bomb.rotationSpeed * 0.05;
        
        // 檢查是否飛出畫面
        const bombWidth = bomb.width;
        if ((bomb.fromLeft && bomb.x > gameCanvas.width + bombWidth/2) || 
            (!bomb.fromLeft && bomb.x < -bombWidth/2)) {
            // 炸彈飛出畫面，移除
            bombs.splice(i, 1);
        }
    }
}

// 結束遊戲
function endGame() {
    currentState = GameState.GAME_OVER;
    crosshair.style.display = 'none';
    
    // 停止計時器（如果是隨機模式）
    if (isRandomMode && gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // 清空炸彈
    bombs = [];
    
    // 更新最終分數顯示
    document.getElementById('finalScore').textContent = score;
    
    // 添加歷史記錄
    const gameName = currentGameId === 'birdShooting' ? '飛鳥射擊遊戲' : '未知遊戲';
    addHistoryRecord(score, currentDifficulty.name, gameName);
    
    // 顯示遊戲結束訊息
    setTimeout(() => {
        document.getElementById('gameOverMessage').style.display = 'block';
    }, 500);
}

// 繪製飛鳥
function drawBirds() {
    birds.forEach(bird => {
        ctx.fillStyle = bird.color;
        
        // 繪製飛鳥身體
        ctx.beginPath();
        ctx.ellipse(bird.x, bird.y, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製翅膀
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            bird.x - (bird.speed > 0 ? -10 : 10), 
            bird.y - 5, 
            bird.width/3, 
            bird.height/1.5, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 繪製眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            bird.x + (bird.speed > 0 ? bird.width/4 : -bird.width/4), 
            bird.y - 5, 
            5, 0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            bird.x + (bird.speed > 0 ? bird.width/4 : -bird.width/4), 
            bird.y - 5, 
            2, 0, Math.PI * 2
        );
        ctx.fill();
    });
}

// 繪製炸彈 - 修改隨機模式炸彈的繪製
function drawBombs() {
    bombs.forEach(bomb => {
        ctx.save();
        ctx.translate(bomb.x, bomb.y);
        ctx.rotate(bomb.rotation);
        
        // 根據炸彈大小和模式設定顏色
        let bombColor, innerColor, sparkColor;
        
        if (currentDifficulty.name === "隨機") {
            // 隨機模式使用不同顏色區分大小
            if (bomb.size === "large") {
                bombColor = '#FF3333'; // 亮紅色
                innerColor = '#FF6666';
                sparkColor = '#FF9900';
            } else if (bomb.size === "medium") {
                bombColor = '#FF9900'; // 橙色
                innerColor = '#FFCC66';
                sparkColor = '#FF6600';
            } else {
                bombColor = '#FFFF00'; // 黃色
                innerColor = '#FFFF99';
                sparkColor = '#FFCC00';
            }
        } else {
            // 一般和困難模式保持原有顏色
            bombColor = '#FF9900'; // 橙色
            innerColor = '#FFCC66';
            sparkColor = '#FF4500';
        }
        
        // 繪製炸彈外圓
        ctx.fillStyle = bombColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, bomb.width/2, bomb.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製炸彈內圓
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, bomb.width/3, bomb.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製炸彈引信 - 根據大小調整
        const fuseHeight = bomb.width * 0.25; // 引信高度為寬度的25%
        ctx.fillStyle = '#8B4513'; // 棕色
        ctx.fillRect(-bomb.width/20, -bomb.height/2 - fuseHeight, bomb.width/10, fuseHeight);
        
        // 繪製炸彈火花 - 根據大小調整
        ctx.fillStyle = sparkColor;
        ctx.beginPath();
        ctx.ellipse(0, -bomb.height/2 - fuseHeight, bomb.width/10, bomb.width/8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製危險符號 - 根據大小調整字體
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + (bomb.width/6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0);
        
        // 如果是隨機模式，在炸彈上顯示大小標識
        if (currentDifficulty.name === "隨機") {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold ' + (bomb.width/10) + 'px Arial';
            let sizeText;
            if (bomb.width === 20) sizeText = "1x";
            else if (bomb.width === 30) sizeText = "1.5x";
            else sizeText = "2x";
            ctx.fillText(sizeText, 0, bomb.height/3);
        }
        
        ctx.restore();
        
        // 繪製炸彈閃爍效果 - 根據模式調整閃爍頻率
        const flashSpeed = currentDifficulty.name === "隨機" ? 150 : 200; // 隨機模式閃爍更快
        if (Math.sin(Date.now() / flashSpeed) > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(bomb.x, bomb.y, bomb.width/2 + 5, bomb.height/2 + 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

// 繪製遊戲背景
function drawBackground() {
    // 繪製漸層背景
    const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 繪製雲朵
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
        const x = (Date.now() / 10000 + i * 0.5) % 1 * gameCanvas.width * 2 - gameCanvas.width;
        const y = i * 100 + 50;
        const width = 100 + i * 30;
        const height = 40 + i * 10;
        
        ctx.beginPath();
        ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        ctx.ellipse(x + width * 0.5, y - height * 0.3, width * 0.6, height * 0.8, 0, 0, Math.PI * 2);
        ctx.ellipse(x - width * 0.5, y - height * 0.3, width * 0.6, height * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 遊戲主循環
function gameLoop() {
    if (currentState === GameState.PLAYING) {
        // 生成和更新飛鳥
        spawnBird();
        updateBirds();
        
        // 生成和更新炸彈（只有一般、困難和隨機模式才有）
        if (currentDifficulty.hasBombs) {
            spawnBomb();
            updateBombs();
        }
        
        // 繪製遊戲
        drawBackground();
        drawBirds();
        if (currentDifficulty.hasBombs) {
            drawBombs();
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// 初始化遊戲
window.onload = init;