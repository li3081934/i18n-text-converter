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

		// Navigate the nested structure to check if key exists
		let keyExists = false;
		let existingValue = '';
		let tempObj = jsonData;
		
		for (let i = 0; i < keyParts.length; i++) {
			const part = keyParts[i];
			if (tempObj && typeof tempObj === 'object' && tempObj.hasOwnProperty(part)) {
				if (i === keyParts.length - 1) {
					// This is the final key
					keyExists = true;
					existingValue = tempObj[part];
					break;
				} else {
					tempObj = tempObj[part];
				}
			} else {
				break;
			}
		}

		// If key exists, ask user for confirmation to overwrite
		if (keyExists) {
			const result = await vscode.window.showWarningMessage(
				`Key "${key}" already exists with value: "${existingValue}"\n\nDo you want to overwrite it with: "${value}"?`,
				{ modal: true },
				'Yes, Overwrite',
				'No, Cancel'
			);

			if (result !== 'Yes, Overwrite') {
				console.log('User cancelled overwrite operation');
				return false;
			}
		}

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

		const action = keyExists ? 'Overwritten' : 'Added';
		console.log(`${action} i18n file: ${key} = "${value}"`);
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
	const matchingResults = findKeyPathsByValue(i18nData, selectedText);

	// Handle exact matches first
	if (matchingResults.exact.length === 1) {
		// Single exact match found, use it directly
		const match = matchingResults.exact[0];
		i18nKey = match.path;
		translationEntry = `Found existing key: ${match.path} = "${match.value}"`;
		console.log(`Found existing translation: ${match.path} = "${match.value}"`);
		
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
	} else if (matchingResults.exact.length > 1 || matchingResults.fuzzy.length > 0) {
		// Multiple exact matches or fuzzy matches found, let user choose
		const quickPickItems: vscode.QuickPickItem[] = [];
		
		// Add exact matches first
		matchingResults.exact.forEach(result => {
			quickPickItems.push({
				label: `🎯 ${result.path}`,
				description: result.value,
				detail: `Exact match - Key: ${result.path}`,
				picked: false
			});
		});
		
		// Add fuzzy matches
		matchingResults.fuzzy.forEach(result => {
			quickPickItems.push({
				label: `🔍 ${result.path}`,
				description: result.value,
				detail: `Fuzzy match - Key: ${result.path}`,
				picked: false
			});
		});
		
		// Add custom input option
		quickPickItems.push({
			label: '✏️ Create custom key',
			description: 'Input your own i18n key',
			detail: 'Create a new translation key',
			picked: false
		});

		vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Select an i18n key or create a custom one:',
			matchOnDescription: true,
			matchOnDetail: true
		}).then(selectedItem => {
			if (!selectedItem) {
				// User cancelled the selection
				return;
			}

			// Check if user selected the custom input option
			if (selectedItem.label === '✏️ Create custom key') {
				// Show input box for custom key
				const suggestedKey = generateI18nKey(selectedText);
				
				vscode.window.showInputBox({
					prompt: 'Enter i18n key for the selected text',
					value: suggestedKey,
					placeHolder: 'e.g., common.greeting or buttons.submit'
				}).then(userInputKey => {
					if (!userInputKey) {
						return;
					}
					
					i18nKey = userInputKey.trim();
					
					// Update the JSON file with the new key-value pair
					updateI18nJsonFile(i18nKey, selectedText).then(success => {
						if (success) {
							const i18nCall = generateI18nCall(i18nKey);
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
			} else {
				// User selected an existing key
				// Extract the path from the label (remove emoji and spaces)
				let selectedPath = selectedItem.label;
				
				// Remove emoji prefixes more reliably
				if (selectedPath.startsWith('🎯 ')) {
					selectedPath = selectedPath.substring(3); // Remove "🎯 "
				} else if (selectedPath.startsWith('🔍 ')) {
					selectedPath = selectedPath.substring(3); // Remove "🔍 "
				}
				
				console.log('Selected path:', selectedPath);
				console.log('Original label:', selectedItem.label);
				
				// Find the corresponding match result
				const allMatches = [...matchingResults.exact, ...matchingResults.fuzzy];
				const selectedMatch = allMatches.find(match => match.path === selectedPath);
				
				console.log('All matches:', allMatches.map(m => m.path));
				console.log('Selected match:', selectedMatch);
				
				if (selectedMatch) {
					i18nKey = selectedMatch.path;
					translationEntry = `Selected existing key: ${selectedMatch.path} = "${selectedMatch.value}"`;
					console.log(`Selected existing translation: ${selectedMatch.path} = "${selectedMatch.value}"`);
					
					const i18nCall = generateI18nCall(i18nKey);
					editor.edit(editBuilder => {
						editBuilder.replace(selection, i18nCall);
					}).then(() => {
						vscode.window.showInformationMessage(`Converted to selected i18n key: ${i18nCall}`);
						vscode.env.clipboard.writeText(translationEntry);
						vscode.window.showInformationMessage('Translation info copied to clipboard');
					});
				} else {
					vscode.window.showErrorMessage(`Could not find match for selected path: ${selectedPath}`);
					console.error('Failed to find selected match. Available paths:', allMatches.map(m => m.path));
				}
			}
		});
	} else {
		// No matches found, prompt user for custom key
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
 * Searches for values in the i18n JSON object that match the search text
 * @param obj - The JSON object to search in
 * @param searchValue - The value to search for
 * @param currentPath - The current path being built (used for recursion)
 * @returns Object with exact and fuzzy matches
 */
function findKeyPathsByValue(obj: any, searchValue: string, currentPath: string = ''): {
	exact: Array<{path: string, value: string}>,
	fuzzy: Array<{path: string, value: string}>
} {
	const exactMatches: Array<{path: string, value: string}> = [];
	const fuzzyMatches: Array<{path: string, value: string}> = [];
	
	if (!obj || typeof obj !== 'object') {
		return { exact: exactMatches, fuzzy: fuzzyMatches };
	}

	// Normalize search value for comparison
	const normalizedSearch = searchValue.toLowerCase().trim();

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key];
			const newPath = currentPath ? `${currentPath}.${key}` : key;

			// Check if current value matches the search value
			if (typeof value === 'string') {
				const normalizedValue = value.toLowerCase().trim();
				
				// Exact match
				if (normalizedValue === normalizedSearch) {
					exactMatches.push({path: newPath, value: value});
				}
				// Fuzzy match: contains the search text (but not exact)
				else if (normalizedValue.includes(normalizedSearch) || normalizedSearch.includes(normalizedValue)) {
					fuzzyMatches.push({path: newPath, value: value});
				}
			}

			// If value is an object, search recursively
			if (typeof value === 'object' && value !== null) {
				const nestedResults = findKeyPathsByValue(value, searchValue, newPath);
				exactMatches.push(...nestedResults.exact);
				fuzzyMatches.push(...nestedResults.fuzzy);
			}
		}
	}

	return { exact: exactMatches, fuzzy: fuzzyMatches };
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
