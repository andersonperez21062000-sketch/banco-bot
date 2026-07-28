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
    
    // Inicia el navegador
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Navega a Bancolombia
    await page.goto('https://www.bancolombia.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Página cargada');

    // ========== INGRESA USUARIO ==========
    try {
      // El campo de usuario tiene id="username"
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.type('#username', usuario);
      console.log('✅ Usuario ingresado');
    } catch (error) {
      console.log('⚠️ No se encontró campo de usuario:', error.message);
      throw new Error('No se pudo encontrar el campo de usuario');
    }

    // ========== INGRESA CLAVE ==========
    try {
      // El campo de clave tiene id="password"
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.type('#password', clave);
      console.log('✅ Clave ingresada');
    } catch (error) {
      console.log('⚠️ No se encontró campo de clave:', error.message);
      throw new Error('No se pudo encontrar el campo de clave');
    }

    // ========== BUSCA Y HACE CLIC EN BOTÓN INICIAR SESIÓN ==========
    try {
      // El botón tiene data-test="login-button"
      await page.waitForSelector('button[data-test="login-button"]', { timeout: 10000 });
      
      // Espera a que el botón esté habilitado
      await page.waitForFunction(() => {
        const btn = document.querySelector('button[data-test="login-button"]');
        return btn && !btn.disabled;
      }, { timeout: 10000 });
      
      await page.click('button[data-test="login-button"]');
      console.log('✅ Botón de inicio de sesión presionado');
    } catch (error) {
      console.log('⚠️ No se encontró botón de login:', error.message);
      throw new Error('No se pudo encontrar el botón de inicio de sesión');
    }

    console.log('⏳ Esperando carga del dashboard...');
    
    // Espera a que cargue el dashboard
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
      console.log('⚠️ Navegación no completada, continuando...');
    }

    await page.waitForTimeout(3000); // Espera adicional para que cargue todo

    console.log('✅ Login completado');

    // ========== BUSCA EL SALDO ==========
    const saldo = await page.evaluate(() => {
      // Busca específicamente en la estructura que encontramos
      // class="account-item__balance"
      const saldoDiv = document.querySelector('.account-item__balance');
      
      if (saldoDiv) {
        // Busca los spans con aria-hidden="true" que contienen el dinero
        const spans = saldoDiv.querySelectorAll('span[aria-hidden="true"]');
        
        let saldoCompleto = '';
        
        // Extrae el saldo de los spans
        spans.forEach((span) => {
          const texto = span.textContent.trim();
          if (texto && /[\d,.]/.test(texto)) {
            saldoCompleto += texto;
          }
        });
        
        if (saldoCompleto) {
          return saldoCompleto;
        }
      }

      // Alternativa: busca en todo el texto
      const bodyText = document.body.innerText;
      const matches = bodyText.match(/\$\s*[\d,.]+/g);
      if (matches && matches.length > 0) {
        return matches[0]; // Retorna el primer valor encontrado
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
