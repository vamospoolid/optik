// deploy_from_github.js
// -------------------------------------------------------------------
// This script automates deployment to the VPS by pulling the latest
// code from the GitHub repository, installing dependencies, building
// the frontend, and restarting the Node/PM2 services.
// -------------------------------------------------------------------

const { Client } = require('ssh2');
const path = require('path');
const { execSync } = require('child_process');

// -------------------------------------------------------------------
// Configuration – read credentials from environment variables for security.
// Set these in your local shell before running the script, e.g.:
//   export VPS_HOST=173.212.243.240
//   export VPS_USER=root
//   export VPS_PASS=your_password   # or VPS_KEY_PATH for a private key
// -------------------------------------------------------------------
const config = {
  host: process.env.VPS_HOST,          // VPS IP or hostname
  port: 22,
  username: process.env.VPS_USER,
  // Prefer SSH key authentication. If VPS_PASS is defined, fall back to password.
  ...(process.env.VPS_KEY_PATH
    ? { privateKey: require('fs').readFileSync(process.env.VPS_KEY_PATH) }
    : { password: process.env.VPS_PASS })
};

if (!config.host || !config.username) {
  console.error('[ERROR] Missing required VPS credentials (VPS_HOST, VPS_USER).');
  process.exit(1);
}

const REMOTE_DIR = '/var/www/optik88'; // Remote project root (both frontend & backend)

/**
 * Execute a command on the remote VPS via SSH.
 * Returns a Promise that resolves with the command's stdout.
 */
function runRemoteCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code, signal) => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`Remote command failed (code ${code}): ${stderr.trim()}`));
      })
        .on('data', data => { stdout += data; process.stdout.write(data); })
        .stderr.on('data', data => { stderr += data; process.stderr.write(data); });
    });
  });
}

/**
 * Main deployment workflow.
 */
async function deploy() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('[INFO] ✅ SSH connection established');
    try {
      // 1. Ensure the remote directory exists
      await runRemoteCommand(conn, `mkdir -p ${REMOTE_DIR}`);

      // 2. Pull latest code from GitHub
      console.log('[INFO] Pulling latest code from GitHub...');
      await runRemoteCommand(conn, `cd ${REMOTE_DIR} && git fetch --prune && git reset --hard origin/main`);

      // 3. Install backend dependencies
      console.log('[INFO] Installing backend dependencies...');
      await runRemoteCommand(conn, `cd ${REMOTE_DIR}/backend && npm ci`);

      // 4. Install frontend dependencies and build
      console.log('[INFO] Installing frontend dependencies...');
      await runRemoteCommand(conn, `cd ${REMOTE_DIR}/frontend && npm ci`);
      console.log('[INFO] Building frontend...');
      await runRemoteCommand(conn, `cd ${REMOTE_DIR}/frontend && npm run build`);

      // 5. Restart services (adjust to your process manager)
      // Example uses PM2 – change if you use systemd, Docker, etc.
      console.log('[INFO] Restarting backend service with PM2...');
      await runRemoteCommand(conn, `pm2 reload all || pm2 start ${REMOTE_DIR}/backend/src/index.js --name optik-backend`);

      console.log('[SUCCESS] Deployment completed successfully');
    } catch (err) {
      console.error('[ERROR] Deployment failed:', err.message);
    } finally {
      conn.end();
    }
  }).on('error', err => {
    console.error('[ERROR] SSH connection error:', err.message);
    process.exit(1);
  }).connect(config);
}

// Execute the deployment when the script is run directly
if (require.main === module) {
  deploy();
}
// -------------------------------------------------------------------
// End of deploy_from_github.js
// -------------------------------------------------------------------
