# i18n-translator

A tool that translates product strings from English to target languages using OpenAI.

## Features

- Translates JSON localization files from a source language to multiple target languages
- Uses OpenAI's API for high-quality translations
- Supports glossaries for consistent translation of domain-specific terms
- Supports style guides to maintain consistent tone and formatting
- Preserves variables and formatting in translations
- Skips already translated strings to avoid redundant work
- Automatically expands plural forms for keys ending with `_other` containing variables
- Generates appropriate plural forms based on target language grammar rules

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
│   ├── glossary/            # Glossary files
│   │   ├── ar.json          # Arabic glossary
│   │   └── fr.json          # French glossary
│   └── style_guide/         # Style guide files
│       ├── ar.json          # Arabic style guide
│       └── fr.json          # French style guide
├── data/                    # Localization files
│   ├── input/               # Source language files
│   │   └── en.json          # English source strings
│   └── output/              # Generated translations
│       ├── ar.json          # Arabic translations
│       └── fr.json          # French translations
├── src/                     # Source code
│   ├── index.js             # CLI entry point
│   ├── translator.js        # Translation logic
│   └── pluralizer.js        # Pluralization logic
├── .env                     # Environment variables
└── package.json             # Project metadata
```

## Glossary Format

Glossaries are simple key-value JSON objects where the key is the English term and the value is the translated term. Place them in the `config/glossary/{language}.json` file:

```json
{
  "Term": "Translated Term",
  "Another Term": "Another Translated Term"
}
```

## Style Guide Format

Style guides are JSON objects with guidelines for translation. Place them in the `config/style_guide/{language}.json` file:

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

## Pluralization

The translator automatically detects keys ending with `_other` that contain variables (like `{{count}}`) and expands them into all appropriate plural forms for the target language.

For example, if your source English file has:

```json
{
  "count_one": "{{count}} item",
  "count_other": "{{count}} items"
}
```

When translating to Arabic (which has six plural forms), it will generate:

```json
{
  "count_zero": "{{count}} عناصر",
  "count_one": "{{count}} عنصر",
  "count_two": "{{count}} عنصرين",
  "count_few": "{{count}} عناصر",
  "count_many": "{{count}} عنصرًا",
  "count_other": "{{count}} عنصر"
}
```

And for French (which has two plural forms):

```json
{
  "count_one": "{{count}} article",
  "count_other": "{{count}} articles"
}
```

The system uses OpenAI's GPT-4 model to generate grammatically correct plural forms specific to each language.
