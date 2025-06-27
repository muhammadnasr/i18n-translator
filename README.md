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

## Models Used

### Translation Model

The system uses OpenAI's GPT-3.5-Turbo model for translating strings. This model was chosen for translations because:

- It provides good quality translations at a lower cost compared to GPT-4
- It has faster response times, which is important for batch processing many strings
- For straightforward translation tasks with clear context and instructions, it performs adequately

The temperature is set to 0.3 to ensure consistent and deterministic translations that strictly follow glossaries and style guides.

### Pluralization Model

For pluralization, the system uses OpenAI's GPT-4 model. This more advanced model was chosen for pluralization because:

- Pluralization requires deeper linguistic understanding of grammatical rules
- GPT-4 has better capabilities for handling complex language-specific plural forms
- The accuracy of plural forms is critical for grammatical correctness
- Pluralization requests are less frequent than translation requests

## Pluralization

The translator automatically detects keys ending with `_other` that contain variables (like `{{count}}`) and expands them into all appropriate plural forms for the target language. 
Since we are always translating from English which only have 2 plural forms (one and other), we keep keys ending with `_one` intact and expand `_other` to all other plural forms.

### Plural Rules Configuration

Pluralization rules for each language are defined in separate configuration files located in the `config/plural_rules/` directory. Each language has its own JSON file (e.g., `ar.json`, `fr.json`) with the following structure:

```json
{
  "instructions": [
    "Language-specific pluralization instructions",
    "More instructions..."
  ],
  "examples": {
    "example_key": {
      "example_key_zero": "Example for zero form",
      "example_key_many": "Example for many form",
      "example_key_other": "Example for other form"
    }
  }
}
```

These configuration files are loaded by the pluralizer and included in the prompt sent to OpenAI's GPT-4 model, which generates grammatically correct plural forms specific to each language. This approach allows for easy maintenance and extension of pluralization rules without modifying the code.
