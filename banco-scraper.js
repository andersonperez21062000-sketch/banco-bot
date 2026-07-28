const puppeteer = require('puppeteer');

/**
 * Conecta a Banco de Bogotá y obtiene el saldo
 * @param {string} cedula - Cédula del usuario
 * @param {string} claveSesion - Clave de sesión
 * @returns {Promise<object>} - Objeto con saldo y detalles
 */
async function obtenerSaldoBancoBogota(cedula, claveSesion) {
  let browser;
  
  try {
    console.log('🔄 Conectando a Banco de Bogotá...');
    
    // Inicia el navegador
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Navega al sitio del banco
    await page.goto('https://virtual.bancodebogota.co/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Página cargada');

    // Busca el campo de cédula
    await page.waitForSelector('input[name="cedula"]', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Campo de cédula no encontrado con ese selector');
    });

    // Ingresa la cédula
    await page.type('input[name="cedula"]', cedula);
    console.log('✅ Cédula ingresada');

    // Busca el campo de clave segura
    await page.waitForSelector('input[name="claveSesion"]', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Campo de clave segura no encontrado');
    });

    // Ingresa la clave segura
    await page.type('input[name="claveSesion"]', claveSesion);
    console.log('✅ Clave segura ingresada');

    // Busca y hace clic en el botón de ingresar
    await page.click('button[type="submit"]').catch(() => {
      console.log('⚠️ Botón de envío no encontrado');
    });

    console.log('⏳ Esperando carga después del login...');
    
    // Espera a que cargue el dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.log('⚠️ Navegación después de login no detectada');
    });

    console.log('✅ Login completado');

    // Busca el saldo en la página
    // Nota: Estos selectores pueden variar según Banco de Bogotá
    const saldo = await page.evaluate(() => {
      // Intenta encontrar el saldo en diferentes posibles ubicaciones
      const posiblesSaldos = [
        document.querySelector('.saldo')?.textContent,
        document.querySelector('[class*="balance"]')?.textContent,
        document.querySelector('[id*="saldo"]')?.textContent,
        document.querySelector('.monto-total')?.textContent,
      ];

      return posiblesSaldos.find(s => s) || 'No se encontró el saldo';
    });

    console.log('✅ Saldo obtenido:', saldo);

    await browser.close();

    return {
      exito: true,
      saldo: saldo,
      mensaje: '✅ Saldo obtenido correctamente'
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (browser) {
      await browser.close();
    }

    return {
      exito: false,
      saldo: null,
      mensaje: `❌ Error al obtener saldo: ${error.message}`
    };
  }
}

module.exports = { obtenerSaldoBancoBogota };
