import puppeteer from 'puppeteer';

/**
 * Converts an HTML string to a PDF buffer using a headless browser.
 * 
 * @param {string} htmlString - The compiled HTML string.
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
export async function generatePdfFromHtml(htmlString) {
  let browser = null;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set HTML content
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensure colors and backgrounds render
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error('Failed to generate PDF from HTML');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
