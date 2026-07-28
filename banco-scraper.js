const puppeteer = require('puppeteer');

/**
 * Conecta a Bancolombia y obtiene el saldo
 * @param {string} usuario - Usuario de Bancolombia
 * @param {string} clave - Clave de cajero (4 dígitos)
 * @returns {Promise<object>} - Objeto con saldo y detalles
 */
async function obtenerSaldoBancolombia(usuario, clave) {
  let browser;
  
  try {
    console.log('🔄 Conectando a Bancolombia...');
    
    // Inicia el navegador con opciones anti-bot
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps'
      ]
    });

    const page = await browser.newPage();
    
    // Desactiva detección de headless
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Simula user agent real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Agrega headers realistas
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-CO,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Navega a Bancolombia
    await page.goto('https://www.bancolombia.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Página cargada');

    // Espera a que cargue la página
    await page.waitForTimeout(2000);

    // ========== INGRESA USUARIO ==========
    try {
      await page.waitForSelector('#username', { timeout: 10000 });
      
      // Escribe lentamente para simular usuario real
      await page.type('#username', usuario, { delay: 100 });
      console.log('✅ Usuario ingresado');
    } catch (error) {
      console.log('⚠️ No se encontró campo de usuario:', error.message);
      throw new Error('No se pudo encontrar el campo de usuario');
    }

    await page.waitForTimeout(1000);

    // ========== INGRESA CLAVE ==========
    try {
      await page.waitForSelector('#password', { timeout: 10000 });
      
      // Escribe lentamente
      await page.type('#password', clave, { delay: 150 });
      console.log('✅ Clave ingresada');
    } catch (error) {
      console.log('⚠️ No se encontró campo de clave:', error.message);
      throw new Error('No se pudo encontrar el campo de clave');
    }

    await page.waitForTimeout(1500);

    // ========== HACE CLIC EN BOTÓN INICIAR SESIÓN ==========
    try {
      await page.waitForSelector('button[data-test="login-button"]', { timeout: 10000 });
      
      // Espera a que el botón esté habilitado
      await page.waitForFunction(() => {
        const btn = document.querySelector('button[data-test="login-button"]');
        return btn && !btn.disabled;
      }, { timeout: 10000 });
      
      // Scroll al botón para simular comportamiento humano
      await page.evaluate(() => {
        document.querySelector('button[data-test="login-button"]').scrollIntoView();
      });

      await page.waitForTimeout(500);
      
      await page.click('button[data-test="login-button"]');
      console.log('✅ Botón de inicio de sesión presionado');
    } catch (error) {
      console.log('⚠️ No se encontró botón de login:', error.message);
      throw new Error('No se pudo encontrar el botón de inicio de sesión');
    }

    console.log('⏳ Esperando carga del dashboard...');
    
    // Espera a que cargue el dashboard (con timeout más largo)
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });
    } catch (error) {
      console.log('⚠️ Navegación no completada, continuando...');
    }

    await page.waitForTimeout(5000); // Espera adicional

    console.log('✅ Login completado');

    // ========== BUSCA EL SALDO ==========
    const saldo = await page.evaluate(() => {
      // Busca en la estructura específica de Bancolombia
      const saldoDiv = document.querySelector('.account-item__balance');
      
      if (saldoDiv) {
        // Busca todos los spans
        const spans = saldoDiv.querySelectorAll('span[aria-hidden="true"]');
        
        let saldoCompleto = '';
        spans.forEach((span) => {
          const texto = span.textContent.trim();
          if (texto && /[\d,.]/.test(texto)) {
            saldoCompleto += texto;
          }
        });
        
        if (saldoCompleto) {
          return '💰 Saldo disponible: $' + saldoCompleto + ' COP';
        }
      }

      // Alternativa: busca patrones de dinero en todo el DOM
      const bodyText = document.body.innerText;
      const matches = bodyText.match(/\$\s*[\d,.]+/g);
      if (matches && matches.length > 0) {
        return '💰 Saldo: ' + matches[0] + ' COP';
      }

      return 'No se encontró el saldo';
    });

    console.log('✅ Saldo obtenido:', saldo);

    await browser.close();

    return {
      exito: true,
      saldo: saldo,
      mensaje: '✅ Saldo obtenido correctamente de Bancolombia'
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error cerrando navegador:', e.message);
      }
    }

    return {
      exito: false,
      saldo: null,
      mensaje: `❌ Error: ${error.message}`
    };
  }
}

module.exports = { obtenerSaldoBancolombia };
