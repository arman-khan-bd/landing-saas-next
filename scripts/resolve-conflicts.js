const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');

walkDir(srcDir, filePath => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<<<<<<<')) {
    console.log(`Resolving conflicts in: ${filePath}`);
    
    const lines = content.split(/\r?\n/);
    const outputLines = [];
    let inTheirs = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('<<<<<<<')) {
        // Start of conflict, we are in ours block now.
        continue;
      } else if (line.startsWith('=======')) {
        // Switch to theirs block.
        inTheirs = true;
        continue;
      } else if (line.startsWith('>>>>>>>')) {
        // End of conflict block.
        inTheirs = false;
        continue;
      }
      
      if (!inTheirs) {
        outputLines.push(line);
      }
    }

    fs.writeFileSync(filePath, outputLines.join('\n'), 'utf8');
    console.log(`Successfully resolved: ${filePath}`);
  }
});
