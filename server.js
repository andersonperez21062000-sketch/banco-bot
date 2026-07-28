require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está configurado en .env');
  console.error('📝 Por favor configura tu token en el archivo .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const userSessions = {};

console.log('🚀 Iniciando Banco Bot...');

// ========== COMANDO: START ==========
bot.start((ctx) => {
  ctx.reply(`
🏦 *¡Bienvenido al Banco Bot!*

Este es un prototipo educativo para consultar saldo.

*Comandos disponibles:*
📝 /registro usuario contraseña - Crear cuenta
🔐 /login usuario contraseña - Iniciar sesión
💰 /saldo - Ver tu saldo
📊 /movimientos - Ver últimos movimientos
🔑 /cambiar_contrasena - Cambiar contraseña
🚪 /logout - Cerrar sesión
❓ /ayuda - Ver esta información

*Ejemplo:*
\`/registro juan123 micontraseña123\`
\`/login juan123 micontraseña123\`
\`/saldo\`

⚠️ *IMPORTANTE:* Nunca uses tus credenciales reales. Este es solo un prototipo.
  `, { parse_mode: 'Markdown' });
});

// ========== COMANDO: AYUDA ==========
bot.help((ctx) => {
  ctx.reply(`
📋 *COMANDOS DEL BANCO BOT*

🔓 *AUTENTICACIÓN:*
/registro usuario contraseña - Crear nueva cuenta
/login usuario contraseña - Iniciar sesión
/logout - Cerrar sesión

💳 *CONSULTAS:*
/saldo - Ver tu saldo actual
/movimientos - Ver últimos 5 movimientos

⚙️ *CONFIGURACIÓN:*
/cambiar_contrasena contraseña_vieja contraseña_nueva
/ayuda - Ver esta información

*Ejemplo de uso:*
\`/registro juan123 micontraseña123\`
\`/login juan123 micontraseña123\`
\`/saldo\`

  `, { parse_mode: 'Markdown' });
});

// ========== COMANDO: REGISTRO ==========
bot.command('registro', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      return ctx.reply('❌ *Uso:* /registro usuario contraseña\n\n*Ejemplo:* /registro juan123 micontraseña123', { parse_mode: 'Markdown' });
    }

    const [username, password] = args;

    // Validar formato
    if (username.length < 3 || password.length < 3) {
      return ctx.reply('❌ Usuario y contraseña deben tener al menos 3 caracteres', { parse_mode: 'Markdown' });
    }

    // Verificar si el usuario ya existe
    const existing = await db.verifyCredentials(username, password);
    if (existing) {
      return ctx.reply('❌ El usuario ya está registrado', { parse_mode: 'Markdown' });
    }

    // Guardar usuario
    const userId = await db.saveUser(ctx.from.id, username, password);
    userSessions[ctx.from.id] = { userId, username, isLoggedIn: true };

    const saldo = await db.getSaldo(userId);
    const saldoFormato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(saldo.saldo);

    ctx.reply(`
✅ *¡Registro exitoso!*

👤 Usuario: \`${username}\`
💰 Saldo inicial: ${saldoFormato}
🏦 Tipo: Cuenta corriente simulada

Ya estás conectado. Usa /saldo para ver tu saldo.
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error en registro:', error);
    ctx.reply('❌ Error en el registro. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
});

// ========== COMANDO: LOGIN ==========
bot.command('login', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      return ctx.reply('❌ *Uso:* /login usuario contraseña\n\n*Ejemplo:* /login juan123 micontraseña123', { parse_mode: 'Markdown' });
    }

    const [username, password] = args;

    // Verificar credenciales
    const user = await db.verifyCredentials(username, password);
    
    if (!user) {
      await db.logAccess(null, 'FAILED_LOGIN', 'telegram');
      return ctx.reply('❌ *Usuario o contraseña incorrectos*', { parse_mode: 'Markdown' });
    }

    // Guardar sesión
    userSessions[ctx.from.id] = { 
      userId: user.id, 
      username: user.username, 
      isLoggedIn: true 
    };

    await db.logAccess(user.id, 'LOGIN', 'telegram');

    const numeroCuenta = Math.random().toString().slice(2, 14);
    const saldo = await db.getSaldo(user.id);
    const saldoFormato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(saldo.saldo);

    ctx.reply(`
✅ *¡Login exitoso!*

👋 Bienvenido *${username}*

💳 Número de cuenta: \`${numeroCuenta}\`
💰 Saldo: ${saldoFormato}
🏦 Banco: Banco Simulado S.A.

*Próximos pasos:*
/saldo - Ver saldo actualizado
/movimientos - Ver movimientos
/cambiar_contrasena - Cambiar contraseña
/logout - Cerrar sesión
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error en login:', error);
    ctx.reply('❌ Error en el login. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
});

// ========== COMANDO: SALDO ==========
bot.command('saldo', async (ctx) => {
  try {
    const session = userSessions[ctx.from.id];
    
    if (!session || !session.isLoggedIn) {
      return ctx.reply('❌ Debes iniciar sesión primero.\n\n*Usa:* /login usuario contraseña', { parse_mode: 'Markdown' });
    }

    const account = await db.getSaldo(session.userId);
    
    if (!account) {
      return ctx.reply('❌ No se encontró tu cuenta', { parse_mode: 'Markdown' });
    }

    const saldoFormato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(account.saldo);

    await db.logAccess(session.userId, 'CONSULTA_SALDO', 'telegram');

    ctx.reply(`
💰 *TU SALDO*

👤 Usuario: *${session.username}*
💵 Saldo disponible: *${saldoFormato}*
🏦 Moneda: COP
📅 Última actualización: ${new Date().toLocaleString('es-CO')}

*Acciones:*
/movimientos - Ver movimientos
/cambiar_contrasena - Cambiar contraseña
/logout - Cerrar sesión
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error consultando saldo:', error);
    ctx.reply('❌ Error al consultar saldo. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
});

// ========== COMANDO: MOVIMIENTOS ==========
bot.command('movimientos', async (ctx) => {
  try {
    const session = userSessions[ctx.from.id];
    
    if (!session || !session.isLoggedIn) {
      return ctx.reply('❌ Debes iniciar sesión primero.\n\n*Usa:* /login usuario contraseña', { parse_mode: 'Markdown' });
    }

    await db.logAccess(session.userId, 'CONSULTA_MOVIMIENTOS', 'telegram');

    const movimientos = `
📊 *ÚLTIMOS MOVIMIENTOS*

🔻 *2024-01-15 | 14:30*
Transferencia enviada
Valor: -$500,000
Saldo: $1,500,000

🔺 *2024-01-14 | 09:15*
Depósito de nómina
Valor: +$2,000,000
Saldo: $2,000,000

🔻 *2024-01-13 | 16:45*
Pago de servicios
Valor: -$150,000
Saldo: $150,000

🔻 *2024-01-12 | 11:20*
Compra en punto de venta
Valor: -$75,000
Saldo: $225,000

🔺 *2024-01-11 | 08:00*
Transferencia recibida
Valor: +$225,000
Saldo: $225,000

*Acciones:*
/saldo - Ver saldo actual
/logout - Cerrar sesión
    `;

    ctx.reply(movimientos, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error consultando movimientos:', error);
    ctx.reply('❌ Error al consultar movimientos. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
});

// ========== COMANDO: CAMBIAR CONTRASEÑA ==========
bot.command('cambiar_contrasena', async (ctx) => {
  try {
    const session = userSessions[ctx.from.id];
    
    if (!session || !session.isLoggedIn) {
      return ctx.reply('❌ Debes iniciar sesión primero.\n\n*Usa:* /login usuario contraseña', { parse_mode: 'Markdown' });
    }

    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      return ctx.reply('❌ *Uso:* /cambiar_contrasena contraseña_vieja contraseña_nueva', { parse_mode: 'Markdown' });
    }

    await db.logAccess(session.userId, 'CAMBIO_CONTRASENA', 'telegram');

    ctx.reply(`
✅ *¡Contraseña cambiada exitosamente!*

🔐 Tu nueva contraseña ha sido guardada de forma segura.

*Acciones:*
/saldo - Ver saldo
/logout - Cerrar sesión
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    ctx.reply('❌ Error al cambiar contraseña. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
});

// ========== COMANDO: LOGOUT ==========
bot.command('logout', (ctx) => {
  if (userSessions[ctx.from.id]) {
    const username = userSessions[ctx.from.id].username;
    delete userSessions[ctx.from.id];
    ctx.reply(`
✅ *Sesión cerrada*

Hasta luego *${username}*

Usa /login para iniciar sesión nuevamente.
    `, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('❌ No hay sesión activa.\n\n*Usa:* /login usuario contraseña', { parse_mode: 'Markdown' });
  }
});

// ========== MANEJO DE OTROS MENSAJES ==========
bot.on('text', (ctx) => {
  ctx.reply(`ℹ️ No entiendo ese comando.\n\n*Usa:* /ayuda para ver los comandos disponibles.`, { parse_mode: 'Markdown' });
});

// ========== INICIAR BOT ==========
bot.launch();
console.log('✅ 🤖 Banco Bot iniciado correctamente');
console.log('📱 El bot está escuchando mensajes en Telegram');
console.log('💡 Tip: Usa /ayuda en Telegram para ver todos los comandos');

// Manejo de errores
process.once('SIGINT', () => {
  console.log('🛑 Bot detenido (SIGINT)');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Bot detenido (SIGTERM)');
  bot.stop('SIGTERM');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
});