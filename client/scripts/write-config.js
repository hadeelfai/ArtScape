const fs = require('fs');
const apiUrl = process.env.VITE_API_URL || '';
fs.writeFileSync('dist/config.json', JSON.stringify({ VITE_API_URL: apiUrl }));
