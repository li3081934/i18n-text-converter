const sharp = require('sharp');
const fs = require('fs');

// Read SVG file
const svgBuffer = fs.readFileSync('icon.svg');

// Convert SVG to PNG with 128x128 resolution
sharp(svgBuffer)
  .resize(128, 128)
  .png()
  .toFile('icon.png')
  .then(() => {
    console.log('✅ Icon converted successfully: icon.png');
    // Clean up - remove the conversion script and sharp dependency
    fs.unlinkSync('convert-icon.js');
  })
  .catch(err => {
    console.error('❌ Error converting icon:', err);
  });
