#!/usr/bin/env node
require('dotenv').config();
const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const Translator = require('./translator');

// Initialize the CLI
const program = new Command();

program
  .name('i18n-translator')
  .description('A tool that translates product strings from English to target languages using OpenAI')
  .version('1.0.0');

program
  .command('translate')
  .description('Translate strings from source language to target language(s)')
  .requiredOption('-s, --source <language>', 'Source language code (e.g., en)')
  .requiredOption('-t, --target <languages>', 'Comma-separated list of target language codes (e.g., ar,fr,es)')
  .option('-i, --input-dir <directory>', 'Directory containing source language files', 'data/input')
  .option('-o, --output-dir <directory>', 'Directory for output translated files', 'data/output')
  .action(async (options) => {
    try {
      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        console.error(chalk.red('Error: OPENAI_API_KEY is not set in the .env file'));
        process.exit(1);
      }

      const translator = new Translator(process.env.OPENAI_API_KEY);
      const sourceLanguage = options.source;
      const targetLanguages = options.target.split(',');
      const inputDir = path.resolve(process.cwd(), options.inputDir);
      const outputDir = path.resolve(process.cwd(), options.outputDir);
      
      // Validate source file exists
      const sourceFilePath = path.join(inputDir, `${sourceLanguage}.json`);
      if (!await fs.pathExists(sourceFilePath)) {
        console.error(chalk.red(`Error: Source file ${sourceFilePath} does not exist`));
        process.exit(1);
      }
      
      // Process each target language
      for (const targetLanguage of targetLanguages) {
        const targetFilePath = path.join(outputDir, `${targetLanguage}.json`);
        console.log(chalk.blue(`\nProcessing translation from ${sourceLanguage} to ${targetLanguage}...`));
        
        try {
          const stats = await translator.translateFile(
            sourceLanguage,
            targetLanguage,
            sourceFilePath,
            targetFilePath
          );
          
          console.log(chalk.green(`✓ Translation to ${targetLanguage} completed successfully`));
          console.log(chalk.blue(`  Total strings: ${stats.total}`));
          console.log(chalk.blue(`  Newly translated: ${stats.translated}`));
          console.log(chalk.blue(`  Already translated (skipped): ${stats.skipped}`));
          console.log(chalk.blue(`  Failed translations: ${stats.failed}`));
        } catch (error) {
          console.error(chalk.red(`Error translating to ${targetLanguage}: ${error.message}`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Unexpected error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
