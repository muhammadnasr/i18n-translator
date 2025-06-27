# i18n-translator

A tool that translates product strings from English to target languages using OpenAI.

## Features

- Translates JSON localization files from a source language to multiple target languages
- Uses OpenAI's API for high-quality translations
- Supports glossaries for consistent translation of domain-specific terms
- Supports style guides to maintain consistent tone and formatting
- Preserves variables and formatting in translations
- Skips already translated strings to avoid redundant work

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### Basic Translation

To translate from English to Arabic:

```bash
node src/index.js translate --source en --target ar
```

To translate to multiple languages:

```bash
node src/index.js translate --source en --target ar,fr,es
```

## Project Structure

```
i18n-translator/
├── config/                  # Configuration files
│   ├── ar_glossary.json     # Arabic glossary
│   └── ar_style_guide.json  # Arabic style guide
├── data/                    # Localization files
│   ├── en.json              # English source strings
│   └── ar.json              # Arabic translations
├── src/                     # Source code
│   ├── index.js             # CLI entry point
│   └── translator.js        # Translation logic
├── .env                     # Environment variables
└── package.json             # Project metadata
```

## Glossary Format

Glossaries are simple key-value JSON objects where the key is the English term and the value is the translated term:

```json
{
  "Term": "Translated Term",
  "Another Term": "Another Translated Term"
}
```

## Style Guide Format

Style guides are JSON objects with guidelines for translation:

```json
{
  "tone": "Formal but warm and inviting",
  "audience": "Target audience description",
  "formatting": {
    "dates": "Date format guidelines",
    "numbers": "Number format guidelines",
    "direction": "Text direction guidelines"
  },
  "special_instructions": [
    "Instruction 1",
    "Instruction 2"
  ]
}
```
