// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Global variable to store i18n JSON data
let i18nData: any = {};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "i18n-text-converter" is now active!');

	// Register the convert to i18n command
	const disposable = vscode.commands.registerCommand('i18n-text-converter.convertToI18n', () => {
		convertSelectedTextToI18n();
	});

	context.subscriptions.push(disposable);
}

/**
 * Loads the i18n JSON file based on configuration
 */
function loadI18nJsonFile(): void {
	const config = vscode.workspace.getConfiguration('i18nConverter');
	const jsonFilePath = config.get<string>('jsonFilePath', '');

	if (!jsonFilePath) {
		console.log('No i18n JSON file path configured');
		return;
	}

	// Get workspace folder
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found');
		return;
	}

	// Build absolute path to JSON file
	const absolutePath = path.join(workspaceFolder.uri.fsPath, jsonFilePath);

	try {
		// Check if file exists
		if (!fs.existsSync(absolutePath)) {
			vscode.window.showErrorMessage(`i18n JSON file not found: ${absolutePath}`);
			return;
		}

		// Read and parse JSON file
		const fileContent = fs.readFileSync(absolutePath, 'utf8');
		i18nData = JSON.parse(fileContent);
		
		console.log('i18n JSON file loaded successfully:', absolutePath);
		console.log('Keys found:', Object.keys(i18nData).length);
		
	} catch (error) {
		vscode.window.showErrorMessage(`Error loading i18n JSON file: ${error}`);
		console.error('Error loading i18n JSON file:', error);
	}
}

/**
 * Updates the i18n JSON file with a new key-value pair
 * @param key - The i18n key (can be nested like 'common.greeting')
 * @param value - The translation value
 * @returns Promise<boolean> - Success status
 */
async function updateI18nJsonFile(key: string, value: string): Promise<boolean> {
	const config = vscode.workspace.getConfiguration('i18nConverter');
	const jsonFilePath = config.get<string>('jsonFilePath', '');

	if (!jsonFilePath) {
		vscode.window.showErrorMessage('No i18n JSON file path configured');
		return false;
	}

	// Get workspace folder
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found');
		return false;
	}

	// Build absolute path to JSON file
	const absolutePath = path.join(workspaceFolder.uri.fsPath, jsonFilePath);

	try {
		// Read current JSON content or create empty object
		let jsonData: any = {};
		if (fs.existsSync(absolutePath)) {
			const fileContent = fs.readFileSync(absolutePath, 'utf8');
			jsonData = JSON.parse(fileContent);
		}

		// Split the key by dots to handle nested keys
		const keyParts = key.split('.');
		let currentObj = jsonData;

		// Navigate/create the nested structure
		for (let i = 0; i < keyParts.length - 1; i++) {
			const part = keyParts[i];
			if (!currentObj[part] || typeof currentObj[part] !== 'object') {
				currentObj[part] = {};
			}
			currentObj = currentObj[part];
		}

		// Set the final value
		const finalKey = keyParts[keyParts.length - 1];
		currentObj[finalKey] = value;

		// Write back to file with proper formatting
		const updatedContent = JSON.stringify(jsonData, null, 2);
		fs.writeFileSync(absolutePath, updatedContent, 'utf8');

		// Update the global i18nData variable
		i18nData = jsonData;

		console.log(`Updated i18n file: ${key} = "${value}"`);
		return true;

	} catch (error) {
		vscode.window.showErrorMessage(`Error updating i18n JSON file: ${error}`);
		console.error('Error updating i18n JSON file:', error);
		return false;
	}
}

/**
 * Converts selected text to i18n format
 */
function convertSelectedTextToI18n(): void {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found');
		return;
	}

	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);

	if (!selectedText) {
		vscode.window.showErrorMessage('No text selected');
		return;
	}

	// Load i18n JSON file when conversion is triggered
	loadI18nJsonFile();

	let i18nKey: string;
	let translationEntry: string;

	// Try to find the selected text in the existing JSON data
	const existingKeyPath = findKeyPathByValue(i18nData, selectedText);

	if (existingKeyPath) {
		// Use the existing key path
		i18nKey = existingKeyPath;
		translationEntry = `Found existing key: ${existingKeyPath} = "${selectedText}"`;
		console.log(`Found existing translation: ${existingKeyPath} = "${selectedText}"`);
		
		// Generate i18n function call using custom template
		const i18nCall = generateI18nCall(i18nKey);

		// Replace selected text with i18n call
		editor.edit(editBuilder => {
			editBuilder.replace(selection, i18nCall);
		}).then(() => {
			vscode.window.showInformationMessage(`Converted to existing i18n key: ${i18nCall}`);
			vscode.env.clipboard.writeText(translationEntry);
			vscode.window.showInformationMessage('Translation info copied to clipboard');
		});
	} else {
		// No existing key found, prompt user for custom key
		const suggestedKey = generateI18nKey(selectedText);
		
		vscode.window.showInputBox({
			prompt: 'Enter i18n key for the selected text',
			value: suggestedKey,
			placeHolder: 'e.g., common.greeting or buttons.submit'
		}).then(userInputKey => {
			if (!userInputKey) {
				// User cancelled the input
				return;
			}

			// Use the user input as the key
			i18nKey = userInputKey.trim();
			
			// Update the JSON file with the new key-value pair
			updateI18nJsonFile(i18nKey, selectedText).then(success => {
				if (success) {
					// Generate i18n function call using custom template
					const i18nCall = generateI18nCall(i18nKey);

					// Replace selected text with i18n call
					editor.edit(editBuilder => {
						editBuilder.replace(selection, i18nCall);
					}).then(() => {
						vscode.window.showInformationMessage(`Converted to new i18n key: ${i18nCall}`);
						vscode.window.showInformationMessage('JSON file updated successfully');
						
						translationEntry = `"${i18nKey}": "${selectedText}"`;
						vscode.env.clipboard.writeText(translationEntry);
					});
				}
			});
		});
	}
}

/**
 * Searches for a value in the i18n JSON object and returns the key path
 * @param obj - The JSON object to search in
 * @param searchValue - The value to search for
 * @param currentPath - The current path being built (used for recursion)
 * @returns The key path if found, null otherwise
 */
function findKeyPathByValue(obj: any, searchValue: string, currentPath: string = ''): string | null {
	if (!obj || typeof obj !== 'object') {
		return null;
	}

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key];
			const newPath = currentPath ? `${currentPath}.${key}` : key;

			// Check if current value matches the search value
			if (typeof value === 'string' && value === searchValue) {
				return newPath;
			}

			// If value is an object, search recursively
			if (typeof value === 'object' && value !== null) {
				const result = findKeyPathByValue(value, searchValue, newPath);
				if (result) {
					return result;
				}
			}
		}
	}

	return null;
}

/**
 * Generates i18n function call using user-defined template
 * @param key - The i18n key to insert into the template
 * @returns The formatted i18n function call
 */
function generateI18nCall(key: string): string {
	const config = vscode.workspace.getConfiguration('i18nConverter');
	const template = config.get<string>('outputTemplate', 't(@i18nKey)');
	
	// Replace @i18nKey placeholder with the actual key
	return template.replace('@i18nKey', key);
}

/**
 * Generates an i18n key from text
 */
function generateI18nKey(text: string): string {
	// Clean the text: remove quotes, special characters, and normalize whitespace
	let key = text
		.replace(/['"]/g, '') // Remove quotes
		.replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
		.trim()
		.replace(/\s+/g, ' '); // Normalize whitespace

	// Convert to camelCase
	key = toCamelCase(key);

	return key;
}

/**
 * Converts text to camelCase
 */
function toCamelCase(text: string): string {
	return text
		.toLowerCase()
		.split(' ')
		.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

// This method is called when your extension is deactivated
export function deactivate() {}
