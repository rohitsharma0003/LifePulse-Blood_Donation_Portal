import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

let isClientReady = false;

const puppeteerArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
  '--disable-gpu'
];

const puppeteerConfig = {
  headless: true,
  args: puppeteerArgs
};

// Use installed Chromium if path is specified (e.g. Docker / Linux environments)
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

// Initialize WhatsApp Web Client with LocalAuth for session persistence
let client;
try {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: puppeteerConfig
  });

  client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log(' 📲 SCAN THIS QR CODE WITH WHATSAPP TO CONNECT');
    console.log('======================================================');
    qrcode.generate(qr, { small: true });
    console.log('======================================================\n');
  });

  client.on('ready', () => {
    isClientReady = true;
    console.log('✅ [WhatsApp Web] Client is ready and authenticated!');
  });

  client.on('authenticated', () => {
    console.log('🔐 [WhatsApp Web] Session authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ [WhatsApp Web] Authentication failure:', msg);
    isClientReady = false;
  });

  client.on('disconnected', (reason) => {
    console.warn('⚠️ [WhatsApp Web] Client disconnected:', reason);
    isClientReady = false;
  });

  // Delay client initialization so Express starts instantly and passes Render health checks
  setTimeout(() => {
    try {
      client.initialize().catch((err) => {
        console.warn(`[WhatsApp Web Notice] Client init deferred: ${err.message}. Outbound messages will fallback to server console.`);
      });
    } catch (err) {
      console.warn(`[WhatsApp Web Notice] Deferred init caught: ${err.message}`);
    }
  }, 3000);
} catch (constructErr) {
  console.warn(`[WhatsApp Web Notice] Client construction skipped: ${constructErr.message}`);
}

/**
 * Sends an automated WhatsApp alert to the designated phone number.
 * Formats the phone number to standard international WhatsApp ID.
 * @param {string} phone 
 * @param {string} message 
 */
export const sendWhatsappAlert = async (phone, message) => {
  // Clean phone number: remove +, spaces, dashes, parentheses
  let cleaned = String(phone).replace(/[\s\-\+\(\)]/g, '');

  // If 10 digits (e.g., standard Indian mobile number without country code), default to country code 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  const chatId = cleaned.includes('@c.us') ? cleaned : `${cleaned}@c.us`;

  console.log('\n============================================================');
  console.log(`🚨 [WHATSAPP OUTBOUND ALERT]`);
  console.log(`📱 Recipient Phone: ${phone} (Target ID: ${chatId})`);
  console.log(`📄 Message Body:\n${message}`);
  console.log('============================================================\n');

  if (!isClientReady) {
    console.log(`ℹ️ [WhatsApp Service] Client not authenticated yet. Message logged above. (Simulated delivery)`);
    return {
      success: true,
      delivered: false,
      simulated: true,
      recipient: chatId,
      note: 'Alert logged to console. Pair WhatsApp Web QR to broadcast live.'
    };
  }

  try {
    const result = await client.sendMessage(chatId, message);
    console.log(`✅ [WhatsApp Service] Alert delivered to ${chatId}. Message ID: ${result.id._serialized}`);
    return {
      success: true,
      delivered: true,
      messageId: result.id._serialized
    };
  } catch (error) {
    console.error(`❌ [WhatsApp Service Error] Failed to send message to ${chatId}:`, error.message);
    return {
      success: false,
      delivered: false,
      error: error.message
    };
  }
};

export default {
  client,
  sendWhatsappAlert
};
