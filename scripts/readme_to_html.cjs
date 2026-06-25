const fs = require('fs');
const { execSync } = require('child_process');

// Read the README
const md = fs.readFileSync('README.md', 'utf8');

// Convert markdown tables, code blocks, headers to basic HTML manually
// Use marked which was already installed
const marked = require('marked');
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Zenith - The Celestial Eye</title>
  <style>
    body { font-family: Georgia, serif; max-width: 900px; margin: 40px auto; padding: 0 40px; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { font-size: 1.4em; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-top: 2em; }
    h3 { font-size: 1.1em; margin-top: 1.5em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9em; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.88em; font-family: monospace; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 0.85em; }
    pre code { background: none; padding: 0; }
    a { color: #0066cc; }
    blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #555; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
    img { max-width: 100%; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync('C:/Users/hp/Desktop/ProjectZenith_README.html', html);
console.log('HTML saved to Desktop as ProjectZenith_README.html');
