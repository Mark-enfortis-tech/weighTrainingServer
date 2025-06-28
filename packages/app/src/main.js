const { app } = require('electron');
const { spawnService } = require('./service-runner');

const services = [
  ['server', 'server'],
  ['command', 'command-handler'],
  ['auth', 'auth-service'],
  ['status', 'status-server'],
  ['telemetry', 'telemetry-handler'],
];

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

app.whenReady().then(() => {
  console.log("Electron Node version:", process.versions.node);

  if (isDev) {
    console.log("Dev mode: using concurrently to run services");
  } else {
    console.log("Prod mode: starting services via Electron"); 
    services.forEach(([label, name]) => spawnService(label, name));
  }

  console.log("Main.js is running...");

  // Create your browser window here, etc...
});
