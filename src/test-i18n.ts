// Test file to verify i18n conversion functionality

const messages = {
  // Original text that can be converted to i18n
  greeting: "Hello World",
  farewell: "Goodbye, see you later!",
  confirmation: "Are you sure you want to delete this item?",
  success: "Operation completed successfully",
  error: "An unexpected error occurred"
};

// After conversion, these should look like:
// greeting: t('helloWorld'),
// farewell: t('goodbyeSeeYouLater'),
// etc.

export default messages;
