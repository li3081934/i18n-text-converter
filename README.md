# i18n Text Converter

A Visual Studio Code extension that allows you to easily convert selected text to i18n (internationalization) markers through a convenient right-click context menu.

## Features

- **Right-click context menu**: Select any text in your editor and right-click to access the "Convert to i18n" option
- **Smart fuzzy matching**: Automatically searches for existing translations using fuzzy matching
- **Multi-match selection**: When multiple matches are found, presents a selection dialog
- **Custom key input**: When no match is found, prompts you to enter a custom i18n key
- **JSON file auto-update**: Automatically adds new key-value pairs to your i18n JSON file
- **Nested key support**: Supports nested keys like `common.greeting` or `buttons.primary.submit`
- **Multiple output formats**: Configurable output templates for different i18n libraries
- **Clipboard integration**: Automatically copies translation info to your clipboard

## Usage

### Single Match (Automatic)
1. Select text that has exactly one match in your i18n JSON file
2. Right-click and select "Convert to i18n"
3. Text is automatically replaced with the corresponding i18n call

### Multiple Matches (Selection Dialog)
1. Select text that matches multiple entries (e.g., "保存" matches "保存", "保存全部", "保存成功")
2. Right-click and select "Convert to i18n"
3. A selection dialog appears showing all matches:
   - `buttons.save`: "保存"
   - `buttons.saveAll`: "保存全部"
   - `messages.success.saved`: "保存成功"
4. Choose the most appropriate match
5. Text is replaced with the selected i18n call

### New Translations (Custom Input)
1. Select text that doesn't exist in your i18n JSON file
2. Right-click and select "Convert to i18n"
3. An input box appears with a suggested key name
4. Enter your desired key (supports nested keys)
5. The JSON file is automatically updated
6. Text is replaced with the formatted i18n call

## Fuzzy Matching Rules

1. **Exact Match** (Highest Priority): Perfect text match
2. **Contains Match**: Selected text contains or is contained in JSON values
3. **Case Insensitive**: Matching ignores case differences

## Examples

### Single Exact Match
- Selected: `"网络错误"`
- Found: `messages.error.network: "网络错误"`
- Result: `t('messages.error.network')` (automatic)

### Multiple Fuzzy Matches
- Selected: `"保存"`
- Found multiple matches:
  - `buttons.save: "保存"`
  - `buttons.saveAll: "保存全部"`
  - `messages.success.saved: "保存成功"`
- Action: Selection dialog appears
- Result: User chooses → `t('buttons.save')`

### No Match
- Selected: `"新功能"`
- Found: No matches
- Action: Input dialog with suggested key `xinGongNeng`
- User inputs: `features.newFeature`
- Result: JSON updated + `t('features.newFeature')`

## Requirements

- Visual Studio Code version 1.102.0 or higher

## Extension Settings

This extension contributes the following settings:

- `i18nConverter.jsonFilePath`: Path to the i18n JSON file (relative to workspace root)
  - Example: `"src/locales/en.json"` or `"i18n.json"`
  - Default: empty string (no file loaded)

- `i18nConverter.outputTemplate`: Template for i18n function call output
  - Use `@i18nKey` as placeholder for the i18n key
  - Examples: 
    - `"t('@i18nKey')"` → `t('helloWorld')`
    - `"$t('@i18nKey')"` → `$t('helloWorld')`
    - `"i18n.t('@i18nKey')"` → `i18n.t('helloWorld')`
    - `"translate('@i18nKey')"` → `translate('helloWorld')`
  - Default: `"t('@i18nKey')"`

## Configuration Examples

### Basic Configuration
```json
{
  "i18nConverter.jsonFilePath": "i18n.json",
  "i18nConverter.outputTemplate": "t('@i18nKey')"
}
```

### Vue.js Configuration
```json
{
  "i18nConverter.jsonFilePath": "src/locales/zh-CN.json",
  "i18nConverter.outputTemplate": "$t('@i18nKey')"
}
```

### React i18next Configuration
```json
{
  "i18nConverter.jsonFilePath": "public/locales/en/translation.json",
  "i18nConverter.outputTemplate": "t('@i18nKey')"
}
```

## Usage Examples

With default settings:
- Selected text: `"你好"` (found in JSON at `common.greeting`)
- Output: `t('common.greeting')`

With custom template `"$t('@i18nKey')"`:
- Selected text: `"你好"` (found in JSON at `common.greeting`)  
- Output: `$t('common.greeting')`

The extension will load the specified JSON file when conversion is triggered and log the number of keys found.

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
