# Change Log

All notable changes to the "i18n-text-converter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

# Change Log

## [0.1.4] - 2025-08-08
### Added
- Duplicate key detection with overwrite confirmation dialog
- When updating JSON file with existing key, prompts user to confirm overwrite
- Modal dialog shows existing and new values for comparison
- User can choose to overwrite or cancel the operation

## [0.1.3] - 2025-08-05
### Fixed
- Fixed bug where selecting fuzzy match options had no effect
- Improved emoji handling in QuickPick selection parsing
- Added debug logging for better troubleshooting
- Enhanced error handling for unmatched selections

## [0.1.2] - 2025-08-05
### Enhanced
- Optimized text matching strategy with intelligent priority handling
- Exact matches are now processed immediately without user intervention
- Fuzzy matches display in an enhanced selection interface with visual indicators (🎯 for exact, 🔍 for fuzzy)
- Added custom key creation option (✏️) directly in the selection menu
- Improved user experience with clear visual distinction between match types

## [0.1.1] - 2025-08-04
### Changed
- Changed configuration scope from global to project-level (resource scope)
- Both `i18nConverter.jsonFilePath` and `i18nConverter.outputTemplate` now support workspace-specific settings

## [0.1.0] - 2025-08-04

### Added
- **Fuzzy matching support**: Smart text matching with multiple result handling
- **Multi-selection dialog**: QuickPick interface when multiple matches are found
- **Priority matching**: Exact matches get highest priority over fuzzy matches
- **Improved user experience**: Better handling of ambiguous matches

### Enhanced
- **Matching algorithm**: Now supports both exact and partial text matching
- **Case insensitive matching**: Ignores case differences in text comparison
- **Bidirectional matching**: Supports both "contains" and "is contained by" relationships

### Fixed
- **Better error handling**: More robust file operations and user feedback
- **Improved performance**: Optimized search algorithm for large JSON files

## [0.0.1] - 2025-08-04

### Added
- Initial release
- Right-click context menu integration
- Basic i18n text conversion
- Custom output template support
- JSON file auto-update functionality
- Nested key support
- Configurable output formats