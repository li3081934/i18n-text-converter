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
		try {
			// Try to parse JSON, fallback to empty object if parsing fails
			const parsed = JSON.parse(fileContent);
			i18nData = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
		} catch (parseError) {
			console.warn(`JSON parsing failed for ${absolutePath}, using empty object:`, parseError);
			i18nData = {};
			vscode.window.showWarningMessage(`Invalid JSON format in ${absolutePath}, using empty data`);
		}
		
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
	const i18nDirectory = config.get<string>('i18nDirectory', '');

	if (!jsonFilePath && !i18nDirectory) {
		vscode.window.showErrorMessage('No i18n JSON file path or directory configured');
		return false;
	}

	// Get workspace folder
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found');
		return false;
	}

	try {
		// First, update the main configured JSON file synchronously
		if (jsonFilePath) {
			const success = await updateSingleI18nFile(key, value, jsonFilePath, workspaceFolder);
			if (!success) {
				return false;
			}
		}

		// If i18nDirectory is configured, update other files asynchronously with translation
		if (i18nDirectory) {
			// Don't await this - let it run in background
			updateOtherLanguageFiles(key, value, i18nDirectory, jsonFilePath, workspaceFolder);
		}

		return true;
	} catch (error) {
		vscode.window.showErrorMessage(`Error updating i18n files: ${error}`);
		console.error('Error updating i18n files:', error);
		return false;
	}
}

/**
 * Updates other language files asynchronously with translation
 */
async function updateOtherLanguageFiles(
	key: string, 
	originalValue: string, 
	i18nDirectory: string, 
	mainFilePath: string,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	const directoryPath = path.join(workspaceFolder.uri.fsPath, i18nDirectory);

	if (!fs.existsSync(directoryPath)) {
		console.warn(`i18n directory not found: ${directoryPath}`);
		return;
	}

	// Get all JSON files in the directory
	const allFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.json'));
	
	// Exclude the main configured file
	const mainFileName = mainFilePath ? path.basename(mainFilePath) : '';
	const filesToUpdate = allFiles.filter(file => file !== mainFileName);
	
	if (filesToUpdate.length === 0) {
		console.log('No additional language files to update');
		return;
	}

	console.log(`Found ${filesToUpdate.length} additional language files to update:`, filesToUpdate);

	// Process files asynchronously in background
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Translating to other languages...',
		cancellable: false
	}, async (progress) => {
		const totalFiles = filesToUpdate.length;
		const results: { file: string, success: boolean, language: string, translation?: string }[] = [];

		for (let i = 0; i < filesToUpdate.length; i++) {
			const file = filesToUpdate[i];
			const fileName = path.parse(file).name; // Get filename without extension
			const filePath = path.join(directoryPath, file);

			progress.report({
				increment: (i / totalFiles) * 100,
				message: `Translating to ${fileName}...`
			});

			try {
				// Read current JSON content or create empty object
				let jsonData: any = {};
				if (fs.existsSync(filePath)) {
					const fileContent = fs.readFileSync(filePath, 'utf8');
					try {
						const parsed = JSON.parse(fileContent);
						jsonData = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
					} catch (parseError) {
						console.warn(`JSON parsing failed for ${filePath}, using empty object:`, parseError);
						jsonData = {};
					}
				}

				// Translate the text using filename as language identifier
				const translatedValue = await translateWithCopilot(originalValue, fileName);
				const finalValue = translatedValue || originalValue;

				// Update the JSON data
				updateJsonData(jsonData, key, finalValue);

				// Write back to file
				const updatedContent = JSON.stringify(jsonData, null, 2);
				fs.writeFileSync(filePath, updatedContent, 'utf8');

				console.log(`Updated ${file}: ${key} = "${finalValue}"`);
				results.push({ 
					file, 
					success: true, 
					language: fileName, 
					translation: finalValue
				});

			} catch (error) {
				console.error(`Error updating ${file}:`, error);
				results.push({ 
					file, 
					success: false, 
					language: fileName
				});
			}
		}

		progress.report({ increment: 100, message: 'Complete!' });

		// Show summary message
		const successCount = results.filter(r => r.success).length;
		const failCount = results.length - successCount;
		
		let message = `Translation complete: ${successCount} files updated`;
		if (failCount > 0) {
			message += `, ${failCount} failed`;
		}
		
		// Show detailed results
		const details = results.map(r => 
			r.success 
				? `✅ ${r.language}: "${r.translation}"` 
				: `❌ ${r.language}: Failed`
		).join('\n');
		
		vscode.window.showInformationMessage(message, 'Show Details').then(selection => {
			if (selection === 'Show Details') {
				vscode.window.showInformationMessage(details);
			}
		});
	});
}

/**
 * Updates a single i18n JSON file
 */
async function updateSingleI18nFile(key: string, value: string, jsonFilePath: string, workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
	const absolutePath = path.join(workspaceFolder.uri.fsPath, jsonFilePath);

	try {
		// Read current JSON content or create empty object
		let jsonData: any = {};
		if (fs.existsSync(absolutePath)) {
			const fileContent = fs.readFileSync(absolutePath, 'utf8');
			try {
				// Try to parse JSON, fallback to empty object if parsing fails
				const parsed = JSON.parse(fileContent);
				jsonData = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
			} catch (parseError) {
				console.warn(`JSON parsing failed for ${absolutePath}, using empty object:`, parseError);
				jsonData = {};
			}
		}

		// Check if key exists and handle overwrite confirmation
		const keyExists = await checkKeyExists(jsonData, key);
		if (keyExists.exists) {
			const result = await vscode.window.showWarningMessage(
				`Key "${key}" already exists with value: "${keyExists.value}"\n\nDo you want to overwrite it with: "${value}"?`,
				{ modal: true },
				'Yes, Overwrite',
				'No, Cancel'
			);

			if (result !== 'Yes, Overwrite') {
				console.log('User cancelled overwrite operation');
				return false;
			}
		}

		// Update the JSON data
		updateJsonData(jsonData, key, value);

		// Write back to file
		const updatedContent = JSON.stringify(jsonData, null, 2);
		fs.writeFileSync(absolutePath, updatedContent, 'utf8');

		// Update the global i18nData variable
		i18nData = jsonData;

		const action = keyExists.exists ? 'Overwritten' : 'Added';
		console.log(`${action} i18n file: ${key} = "${value}"`);
		return true;

	} catch (error) {
		console.error('Error updating single i18n file:', error);
		throw error;
	}
}



/**
 * Translates text using Copilot API based on target language
 */
async function translateWithCopilot(text: string, targetLanguage: string): Promise<string | null> {
	try {
		// Get available Copilot models
		const models = await vscode.lm.selectChatModels({
			vendor: 'copilot'
		});

		if (models.length === 0) {
			console.warn('No Copilot models available for translation');
			return null;
		}

		// Use filename directly as language identifier
		const languageIdentifier = targetLanguage;

		// Create the translation prompt
		const messages: vscode.LanguageModelChatMessage[] = [
			vscode.LanguageModelChatMessage.User(`Please translate the following text to ${languageIdentifier}. Only return the translated text without any explanation or additional content:

"${text}"`)
		];

		// Send request to Copilot with timeout
		const model = models[0];
		const response = await model.sendRequest(messages, {});

		// Collect the response
		let translatedText = '';
		for await (const fragment of response.text) {
			translatedText += fragment;
		}

		// Clean up the translated text
		translatedText = translatedText.trim().replace(/^["']|["']$/g, '');
		
		return translatedText || null;

	} catch (error) {
		console.error(`Translation error for ${targetLanguage}:`, error);
		return null;
	}
}

/**
 * Checks if a key exists in the JSON data
 */
async function checkKeyExists(jsonData: any, key: string): Promise<{ exists: boolean, value?: string }> {
	const keyParts = key.split('.');
	let tempObj = jsonData;
	
	for (let i = 0; i < keyParts.length; i++) {
		const part = keyParts[i];
		if (tempObj && typeof tempObj === 'object' && tempObj.hasOwnProperty(part)) {
			if (i === keyParts.length - 1) {
				// This is the final key
				return { exists: true, value: tempObj[part] };
			} else {
				tempObj = tempObj[part];
			}
		} else {
			break;
		}
	}
	
	return { exists: false };
}

/**
 * Updates JSON data with a nested key-value pair
 */
function updateJsonData(jsonData: any, key: string, value: string): void {
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
