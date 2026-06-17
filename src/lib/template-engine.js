import Handlebars from 'handlebars';

/**
 * Compiles an HTML string template with the provided data payload.
 * Uses Handlebars for {{variable}} interpolation.
 * 
 * @param {string} htmlTemplate - The raw HTML string with variables.
 * @param {Object} data - The data object to inject (e.g. { candidate_name: "John" })
 * @returns {string} - The compiled HTML ready for sending or PDF conversion.
 */
export function compileTemplate(htmlTemplate, data) {
  if (!htmlTemplate) return '';
  
  try {
    const template = Handlebars.compile(htmlTemplate);
    return template(data);
  } catch (error) {
    console.error("Template Compilation Error:", error);
    return htmlTemplate; // Fallback to raw if parsing fails
  }
}
