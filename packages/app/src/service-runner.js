const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const { app } = require('electron');

const colorMap = {
  httpServer: chalk.blue,
  aut: chalk.green,

};

function getServicePath(serviceName) {
  const isPackaged = app.isPackaged;

  if (isPackaged) {
    // Real production mode (packaged app)
    return path.join(process.resourcesPath, 'app', 'packages', serviceName);
  }

  // Simulated prod (cross-env NODE_ENV=production) OR dev
  return path.join(__dirname, '..', '..', serviceName); // <- adjust based on where src/ is
}



function spawnService(label, serviceName) {
  const servicePath = getServicePath(serviceName);
  console.log(`Spawn service path: ${servicePath}, serviceName: ${serviceName}`);
  const entryPoint = path.join(servicePath, 'index.js');
  const color = colorMap[label] || chalk.white;

  const nodePath = process.execPath;
  console.log(`Spawning ${entryPoint} using ${nodePath}`);


  const child = spawn(process.execPath, [entryPoint], {
    cwd: servicePath,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(color(`[${label}] `) + data.toString());
  });

  child.on('error', (err) => {
    console.error(`[${label}] Failed to spawn process:`, err);
  });
  

  child.stderr.on('data', (data) => {
    process.stderr.write(color(`[${label} ERROR] `) + data.toString());
  });

  child.on('exit', (code) => {
    console.log(color(`[${label}] exited with code ${code}`));
  });

  return child;
}

module.exports = { spawnService };
