const chalk = require('chalk');

/**
 * Handles pluralization for different languages
 */
class Pluralizer {
  /**
   * Create a new Pluralizer instance
   * @param {OpenAI} openaiClient - OpenAI client instance
   */
  constructor(openaiClient) {
    this.openai = openaiClient;
  }

  /**
   * Generate plural forms for a key that ends with _other
   * @param {string} key - The key ending with _other
   * @param {string} value - The English value with the _other suffix
   * @param {string} translatedValue - The translated value for the _other form
   * @param {string} language - Target language code
   * @returns {Object} - Object containing all plural forms for the target language
   */
  async generatePluralForms(key, value, translatedValue, language) {
    // Extract the base key (remove _other suffix)
    const baseKey = key.replace(/_other$/, '');
    
    // Check if the value contains variables
    if (!value.includes('{{') || !value.includes('}}')) {
      // If no variables, just return the translated value for _other form
      return { [key]: translatedValue };
    }
    
    console.log(chalk.blue(`Generating plural forms for key: ${baseKey} in ${language}`));
    
    // Construct the prompt for plural forms
    const prompt = [
      `I need to create plural forms for the following translation in ${language}:`,
      `Original English (singular): "${value.replace('_other', '_one')}"`,
      `Original English (plural): "${value}"`,
      `Translated plural form (${language}): "${translatedValue}"`,
      `Base key to use: "${baseKey}"`,
      '',
      `For ${language}, generate all appropriate plural forms using the following suffixes:`,
      '- _zero (for zero items)',
      '- _one (for exactly one item)',
      '- _two (for exactly two items, if applicable in the language)',
      '- _few (for a few items, if applicable in the language)',
      '- _many (for many items, if applicable in the language)',
      '- _other (for all other cases)',
      '',
      'Important:',
      '1. Only include plural forms that are grammatically necessary in the target language',
      '2. Preserve all variables like {{count}} in each form',
      `3. Return the result as a valid JSON object with each key being EXACTLY "${baseKey}" + suffix (e.g. "${baseKey}_zero", "${baseKey}_one", etc.)`,
      '4. Make sure the translation is grammatically correct for each plural form',
      '5. For Arabic specifically, include all six forms as they are all used',
      '6. Do not change the base key name under any circumstances',
      '',
      'CRITICAL: Return ONLY the raw JSON object with no markdown formatting, no code blocks (```), and no explanations.'
    ].join('\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional translator with expertise in localization and pluralization rules across different languages.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content.trim();
      
      try {
        const pluralForms = JSON.parse(content);
        console.log(chalk.green(`Successfully generated ${Object.keys(pluralForms).length} plural forms for ${baseKey}`));
        return pluralForms;
      } catch (parseError) {
        console.error(chalk.red(`Failed to parse plural forms JSON: ${parseError.message}`));
        console.log(chalk.yellow('Response content:'), content);
        // Return just the _other form as fallback
        return { [key]: translatedValue };
      }
    } catch (error) {
      console.error(chalk.red(`Error generating plural forms: ${error.message}`));
      // Return just the _other form as fallback
      return { [key]: translatedValue };
    }
  }

  /**
   * Check if a key is a plural key that needs expansion
   * @param {string} key - The key to check
   * @param {string} value - The value to check
   * @returns {boolean} - True if the key is a plural key
   */
  isPluralKey(key, value) {
    return key.endsWith('_other') && value.includes('{{');
  }
}

module.exports = Pluralizer;
