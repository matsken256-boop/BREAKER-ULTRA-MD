const { spawn } = require('child_process');
const path = require('path');

function start() {
    const child = spawn('node', ['index.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });

    child.on('close', (code) => {
        if (code !== 0) {
            console.log(`Bot crashed with code ${code} - Restarting...`);
            setTimeout(start, 3000);
        }
    });

    child.on('error', (err) => {
        console.log(`Restarting due to error: ${err.message}`);
        setTimeout(start, 3000);
    });
}

start();
