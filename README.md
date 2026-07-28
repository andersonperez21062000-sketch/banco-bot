# 🏦 Banco Bot - Telegram

Bot de Telegram para consultar saldo bancario simulado. **Prototipo educativo**.

## 🚀 INICIO RÁPIDO

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/andersonperez21062000-sketch/banco-bot.git
cd banco-bot
```

### Paso 2: Crear tu bot en Telegram (2 minutos)

1. Abre **Telegram** en tu teléfono o en https://web.telegram.org
2. Busca **`@BotFather`**
3. Envía el comando: `/newbot`
4. Sigue los pasos:
   - Dale un nombre (ej: "Mi Banco Bot")
   - Dale un username (ej: `mi_banco_bot_2024`)
5. **Copia el TOKEN** que te genera (empieza con números)

### Paso 3: Configurar el bot (1 minuto)

1. Abre el archivo `.env.example` y renómbralo a `.env`
2. Pega tu TOKEN aquí:
   ```env
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   ```
3. Guarda el archivo

### Paso 4: Instalar y ejecutar (1 minuto)

**Windows/Mac/Linux:**
```bash
npm install
npm start
```

**Deberías ver:**
```
✅ Conectado a la base de datos SQLite
✅ Tabla users lista
✅ Tabla accounts lista
✅ Tabla access_logs lista
✅ 🤖 Banco Bot iniciado correctamente
📱 El bot está escuchando mensajes en Telegram
```

## 📱 USAR EL BOT

Una vez ejecutando, ve a tu bot en Telegram y envía:

### 1️⃣ Registrarse
```
/registro juan123 micontraseña123
```

Respuesta:
```
✅ ¡Registro exitoso!

👤 Usuario: juan123
💰 Saldo inicial: $2,456,789
🏦 Tipo: Cuenta corriente simulada

Ya estás conectado. Usa /saldo para ver tu saldo.
```

### 2️⃣ Ver tu saldo
```
/saldo
```

Respuesta:
```
💰 TU SALDO

👤 Usuario: juan123
💵 Saldo disponible: $2,456,789
🏦 Moneda: COP
📅 Última actualización: 28/1/2024, 14:30:45
```

### 3️⃣ Ver movimientos
```
/movimientos
```

Muestra los últimos 5 movimientos con fechas y valores.

### 4️⃣ Cambiar contraseña
```
/cambiar_contrasena micontraseña123 minevacontraseña456
```

### 5️⃣ Cerrar sesión
```
/logout
```

## 📋 COMANDOS DISPONIBLES

| Comando | Descripción |
|---------|----------|
| `/start` | Mostrar bienvenida |
| `/ayuda` | Ver todos los comandos |
| `/registro usuario contraseña` | Crear una nueva cuenta |
| `/login usuario contraseña` | Iniciar sesión |
| `/saldo` | Ver saldo actual |
| `/movimientos` | Ver últimos movimientos |
| `/cambiar_contrasena vieja nueva` | Cambiar contraseña |
| `/logout` | Cerrar sesión |

## 🛠️ SOLUCIÓN DE PROBLEMAS

### ❌ "TELEGRAM_BOT_TOKEN no está configurado"
**Solución:** Edita el archivo `.env` y añade tu token

### ❌ "Error: Cannot find module 'telegraf'"
**Solución:** Ejecuta `npm install`

### ❌ "El bot no responde en Telegram"
**Solución:** 
1. Verifica que tu TOKEN es correcto
2. Reinicia el bot: presiona `Ctrl+C` y ejecuta `npm start` de nuevo
3. Abre tu bot nuevamente en Telegram

### ❌ "Base de datos bloqueada"
**Solución:** Elimina el archivo `banco.db` y reinicia

## 📁 ESTRUCTURA DEL PROYECTO

```
banco-bot/
├── server.js           ← 🤖 Bot principal
├── database.js         ← 💾 Base de datos
├── .env.example        ← ⚙️ Configuración (copia como .env)
├── package.json        ← 📦 Dependencias
├── README.md           ← 📖 Este archivo
└── .gitignore
```

## 🔒 SEGURIDAD

✅ Contraseñas encriptadas con bcrypt  
✅ Sin almacenamiento de datos en nube  
✅ Base de datos local (SQLite)  
✅ Logs de acceso  

⚠️ **NO uses datos reales** - Este es solo un prototipo educativo

## 💾 BASE DE DATOS

El bot crea 3 tablas automáticamente:

### users
- Almacena usuarios y contraseñas encriptadas
- Solo accesible desde el bot

### accounts
- Almacena saldo (valores simulados)
- Se actualiza con cada login

### access_logs
- Registro de todas las acciones
- Para auditoría

## 📞 SOPORTE

¿Problemas? Abre un issue en:
https://github.com/andersonperez21062000-sketch/banco-bot/issues

## 📄 LICENCIA

MIT - Puedes usar libremente para fines educativos

## 👨‍💻 AUTOR

**Anderson Perez**
- GitHub: [@andersonperez21062000-sketch](https://github.com/andersonperez21062000-sketch)

---

**¿Listo para empezar?**

```bash
npm install && npm start
```

¡Que disfrutes el Banco Bot! 🎉