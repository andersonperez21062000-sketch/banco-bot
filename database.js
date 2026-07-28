const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'banco.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Tabla de usuarios y contraseñas
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✅ Tabla users lista');
  });

  // Tabla de saldos simulados
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      saldo REAL DEFAULT 1000000,
      currency TEXT DEFAULT 'COP',
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating accounts table:', err);
    else console.log('✅ Tabla accounts lista');
  });

  // Tabla de logs de acceso
  db.run(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating access_logs table:', err);
    else console.log('✅ Tabla access_logs lista');
  });
}

// ========== USUARIOS ==========

function saveUser(telegramId, username, password) {
  return new Promise((resolve, reject) => {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.run(
      `INSERT OR IGNORE INTO users (telegram_id, username, password_hash) 
       VALUES (?, ?, ?)`,
      [telegramId, username, passwordHash],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Crear cuenta bancaria simulada
          const saldoAleatorio = Math.floor(Math.random() * 5000000);
          db.run(
            `INSERT OR IGNORE INTO accounts (user_id, saldo) 
             VALUES (?, ?)`,
            [this.lastID, saldoAleatorio],
            (err2) => {
              if (err2) reject(err2);
              else resolve(this.lastID);
            }
          );
        }
      }
    );
  });
}

function getUserByTelegramId(telegramId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE telegram_id = ?`,
      [telegramId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function verifyCredentials(username, password) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, password_hash FROM users WHERE username = ?`,
      [username],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const isValid = bcrypt.compareSync(password, row.password_hash);
          if (isValid) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
}

// ========== SALDO ==========

function getSaldo(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT saldo, currency FROM accounts WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function updateSaldo(userId, newSaldo) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE accounts SET saldo = ?, last_updated = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [newSaldo, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

// ========== LOGS ==========

function logAccess(userId, action, ipAddress) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO access_logs (user_id, action, ip_address) 
       VALUES (?, ?, ?)`,
      [userId, action, ipAddress],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getAccessLogs(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM access_logs WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

module.exports = {
  db,
  saveUser,
  getUserByTelegramId,
  verifyCredentials,
  getSaldo,
  updateSaldo,
  logAccess,
  getAccessLogs
};