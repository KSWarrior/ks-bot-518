const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// === Config ===
const HOST = 'aerio_smp.aternos.me';     // Your server IP
const PORT = 29538;           // Your server port
const USERNAME = 'Player1'; // Or "BotName" if cracked server
const PASSWORD = '';  // Only if premium

const RADIUS = 10;       // Walking radius
const JUMP_INTERVAL = 60 * 1000; // 60 seconds
const WALK_INTERVAL = 15 * 1000; // 15 seconds
const RECONNECT_DELAY = 5000;    // 5 seconds

// === Chat Auto-Replies ===
const CHAT_RESPONSES = {
  hi: "Hello {user}! 👋",
  hello: "Hey {user}, how’s it going? 😎",
  bye: "Goodbye {user}, see you later! 👋",
  help: "I am just a bot 🤖 but I can walk, jump and chat!"
};

let bot;

function getRandomPosition(origin, radius) {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radius;

  return {
    x: Math.floor(origin.x + Math.cos(angle) * distance),
    y: Math.floor(origin.y),
    z: Math.floor(origin.z + Math.sin(angle) * distance)
  };
}

function periodicJump() {
  if (!bot || !bot.entity) return;
  bot.setControlState('jump', true);
  setTimeout(() => bot.setControlState('jump', false), 500);
}

function walkRandom() {
  if (!bot || !bot.entity) return;
  const origin = bot.entity.position;
  const pos = getRandomPosition(origin, RADIUS);

  const movement = new Movements(bot, bot.registry);
  bot.pathfinder.setMovements(movement);
  bot.pathfinder.setGoal(new goals.GoalBlock(pos.x, pos.y, pos.z));
}

function createBot() {
  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('✅ Bot spawned in the world');
    bot.chat('Hello! I am online 🤖');

    clearIntervals();
    bot.jumpInterval = setInterval(periodicJump, JUMP_INTERVAL);
    bot.walkInterval = setInterval(walkRandom, WALK_INTERVAL);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    console.log(`[CHAT] <${username}> ${message}`);
    const lowerMsg = message.toLowerCase();
    if (CHAT_RESPONSES[lowerMsg]) {
      const reply = CHAT_RESPONSES[lowerMsg].replace("{user}", username);
      bot.chat(reply);
    }
  });

  bot.on('end', () => {
    console.log('⚠️ Bot disconnected, reconnecting in 5 seconds...');
    clearIntervals();
    setTimeout(createBot, RECONNECT_DELAY);
  });

  bot.on('kicked', (reason) => {
    console.log('❌ Bot kicked:', reason);
  });

  bot.on('error', (err) => {
    console.log('❌ Bot error:', err.message);
  });
}

function clearIntervals() {
  if (bot?.jumpInterval) clearInterval(bot.jumpInterval);
  if (bot?.walkInterval) clearInterval(bot.walkInterval);
}

createBot();
