const { OpenAI } = require('openai');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Translator {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Load a JSON file
   * @param {string} filePath - Path to the JSON file
   * @returns {Object} - Parsed JSON object
   */
  async loadJsonFile(filePath) {
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow(`File not found: ${filePath}. Creating an empty object.`));
        return {};
      }
      throw error;
    }
  }

  /**
   * Save a JSON file
   * @param {string} filePath - Path to save the JSON file
   * @param {Object} data - Data to save
   */
  async saveJsonFile(filePath, data) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  /**
   * Load glossary for a specific language
   * @param {string} language - Target language code
   * @returns {Object} - Glossary terms
   */
  async loadGlossary(language) {
    const glossaryPath = path.join(process.cwd(), 'config', `${language}_glossary.json`);
    try {
      return await this.loadJsonFile(glossaryPath);
    } catch (error) {
      console.log(chalk.yellow(`No glossary found for ${language}. Proceeding without glossary.`));
      return {};
    }
  }

  /**
   * Load style guide for a specific language
   * @param {string} language - Target language code
   * @returns {Object} - Style guide
   */
  async loadStyleGuide(language) {
    const stylePath = path.join(process.cwd(), 'config', `${language}_style_guide.json`);
    try {
      return await this.loadJsonFile(stylePath);
    } catch (error) {
      console.log(chalk.yellow(`No style guide found for ${language}. Proceeding without style guide.`));
      return {};
    }
  }

  /**
   * Translate a single string using OpenAI
   * @param {string} text - Text to translate
   * @param {string} language - Target language code
   * @param {Object} glossary - Glossary terms
   * @param {Object} styleGuide - Style guide
   * @returns {string} - Translated text
   */
  async translateString(text, language, glossary = {}, styleGuide = {}) {
    // Prepare glossary instructions
    const glossaryInstructions = Object.keys(glossary).length > 0
      ? `Use the following glossary for consistent translation of domain-specific terms:\n${JSON.stringify(glossary, null, 2)}`
      : '';

    // Prepare style guide instructions
    const styleGuideInstructions = Object.keys(styleGuide).length > 0
      ? `Follow these style guidelines:\n${JSON.stringify(styleGuide, null, 2)}`
      : '';

    // Construct the prompt
    const prompt = [
      `Translate the following text from English to ${language}:`,
      `Text: "${text}"`,
      glossaryInstructions,
      styleGuideInstructions,
      'Important: Preserve all formatting, line breaks (\\n), and variables ({{variable_name}}). Do not translate the variable names inside the double curly braces.',
      'Return only the translated text without any explanations or additional text.'
    ].filter(Boolean).join('\n\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional translator with expertise in localization.' },
          { role: 'user', content: prompt }
        ],
        // Lower temperature (0.3) ensures more deterministic and consistent translations
        // This reduces creativity and randomness, which is ideal for accurate localization
        // that strictly follows glossaries and style guides
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error(chalk.red(`Error translating text: ${error.message}`));
      throw error;
    }
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
   * Translate all untranslated strings in a file
   * @param {string} sourceLanguage - Source language code
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceFilePath - Path to source language file
   * @param {string} targetFilePath - Path to target language file
   * @returns {Object} - Statistics about the translation process
   */
  async translateFile(sourceLanguage, targetLanguage, sourceFilePath, targetFilePath) {
    console.log(chalk.blue(`Translating from ${sourceLanguage} to ${targetLanguage}...`));
    
    // Ensure the output directory exists
    const outputDir = path.dirname(targetFilePath);
    await fs.ensureDir(outputDir);
    
    // Load source and target files
    const sourceStrings = await this.loadJsonFile(sourceFilePath);
    const existingTranslations = await this.loadJsonFile(targetFilePath);
    
    // Load glossary and style guide
    const glossary = await this.loadGlossary(targetLanguage);
    const styleGuide = await this.loadStyleGuide(targetLanguage);
    
    const stats = {
      total: Object.keys(sourceStrings).length,
      translated: 0,
      skipped: 0,
      failed: 0
    };
    
    const newTranslations = { ...existingTranslations };
    
    // Process each string in the source file
    for (const [key, value] of Object.entries(sourceStrings)) {
      // Skip if already translated
      if (existingTranslations[key]) {
        console.log(chalk.gray(`Skipping already translated key: ${key}`));
        stats.skipped++;
        continue;
      }
      
      try {
        console.log(chalk.green(`Translating key: ${key}`));
        const translatedText = await this.translateString(value, targetLanguage, glossary, styleGuide);
        
        // Check if this is a plural form key ending with _other and containing variables
        if (key.endsWith('_other') && value.includes('{{')) {
          console.log(chalk.blue(`Detected plural key: ${key}`));
          
          // Generate all plural forms for this key
          const pluralForms = await this.generatePluralForms(key, value, translatedText, targetLanguage);
          
          // Add all plural forms to the translations
          Object.entries(pluralForms).forEach(([pluralKey, pluralValue]) => {
            newTranslations[pluralKey] = pluralValue;
            if (pluralKey !== key) {
              stats.translated++; // Count additional plural forms as translated
            }
          });
        } else {
          // Regular key, just add the translation
          newTranslations[key] = translatedText;
        }
        
        stats.translated++;
        
        // Save progress after each successful translation
        await this.saveJsonFile(targetFilePath, newTranslations);
      } catch (error) {
        console.error(chalk.red(`Failed to translate key: ${key}`));
        stats.failed++;
      }
    }
    
    console.log(chalk.blue('Translation completed:'));
    console.log(chalk.blue(`Total: ${stats.total}, Translated: ${stats.translated}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`));
    
    return stats;
  }
}

module.exports = Translator;
