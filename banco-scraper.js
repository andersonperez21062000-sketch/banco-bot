const puppeteer = require('puppeteer');

/**
 * Conecta a Banco de Bogotá y obtiene el saldo
 * @param {string} cedula - Cédula del usuario
 * @param {string} claveSesion - Clave de sesión (4 dígitos)
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

    // ========== INGRESA CÉDULA ==========
    try {
      // El campo de cédula tiene id="sp-at-input"
      await page.waitForSelector('#sp-at-input', { timeout: 10000 });
      await page.type('#sp-at-input', cedula);
      console.log('✅ Cédula ingresada');
    } catch (error) {
      console.log('⚠️ No se encontró campo de cédula:', error.message);
      throw new Error('No se pudo encontrar el campo de cédula');
    }

    // ========== INGRESA CLAVE SEGURA ==========
    try {
      // El campo de clave tiene id="secure"
      await page.waitForSelector('#secure', { timeout: 10000 });
      await page.type('#secure', claveSesion);
      console.log('✅ Clave segura ingresada');
    } catch (error) {
      console.log('⚠️ No se encontró campo de clave:', error.message);
      throw new Error('No se pudo encontrar el campo de clave segura');
    }

    // ========== BUSCA Y HACE CLIC EN BOTÓN INGRESAR ==========
    try {
      // El botón tiene class="sp-at-btn sp-at-btn--primary sp-at-btn--lg"
      await page.waitForSelector('button[type="submit"].sp-at-btn--primary', { timeout: 10000 });
      await page.click('button[type="submit"].sp-at-btn--primary');
      console.log('✅ Botón de ingreso presionado');
    } catch (error) {
      console.log('⚠️ No se encontró botón de envío:', error.message);
      throw new Error('No se pudo encontrar el botón de ingreso');
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
      // Array de selectores posibles donde puede estar el saldo
      const selectores = [
        // Por ID
        document.querySelector('#saldo'),
        document.querySelector('#balance'),
        document.querySelector('#total-saldo'),
        
        // Por clase
        document.querySelector('.saldo'),
        document.querySelector('.balance'),
        document.querySelector('.total-balance'),
        document.querySelector('.amount'),
        document.querySelector('.balance-amount'),
        document.querySelector('[class*="saldo"]'),
        document.querySelector('[class*="balance"]'),
        document.querySelector('[class*="amount"]'),
        
        // Por atributo data
        document.querySelector('[data-saldo]'),
        document.querySelector('[data-balance]'),
        
        // Busca por texto que contenga números con formato de dinero
        ...document.querySelectorAll('span, div, p, h1, h2, h3')
      ];

      // Filtra elementos que contengan dinero
      for (let elemento of selectores) {
        if (!elemento) continue;
        
        const texto = elemento.textContent.trim();
        
        // Busca patrones de dinero: $1.000.000 o $1,000,000
        if (/\$[\d,.]+/.test(texto)) {
          return texto;
        }
      }

      // Si no encuentra con selectores, busca en todo el DOM
      const bodyText = document.body.innerText;
      const matches = bodyText.match(/\$[\d,.]+/g);
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
      mensaje: '✅ Saldo obtenido correctamente'
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

module.exports = { obtenerSaldoBancoBogota };
