// deploy_vps_github.js
// --------------------------------------------------------------
// Deploy the Optik application to a VPS directly from GitHub.
// This script uses the SSH2 library to connect to the server,
// pulls the latest code, installs dependencies, builds the
// backend (NestJS) and frontend (Next.js), and restarts the
// processes with PM2.
// --------------------------------------------------------------

const { Client } = require('ssh2');
const path = require('path');
const { execSync } = require('child_process');

// ----- VPS credentials (provided by the user) -----
const config = {
  host: '173.212.243.240',
  port: 22,
  username: 'root',
  password: 'Ahmad_dcc07',
};

// Remote location where the project will live on the VPS
const REMOTE_DIR = '/var/www/optik88';
// Git repository (HTTPS URL – you can switch to SSH if the VPS
// has a deploy key configured)
const GIT_REPO = 'https://github.com/vamospoolid/optik.git';

/** Helper: run a remote command via SSH */
function runRemote(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`[VPS] ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream
        .on('close', (code) => {
          if (code === 0) resolve(stdout.trim());
          else reject(new Error(`Command "${cmd}" exited with code ${code}\n${stderr}`));
        })
        .on('data', (data) => {
          stdout += data;
          process.stdout.write(data);
        })
        .stderr.on('data', (data) => {
          stderr += data;
          process.stderr.write(data);
        });
    });
  });
}

/** Helper: upload a local file to the VPS */
function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`[SFTP] Uploading ${path.basename(localPath)} → ${remotePath}`);
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function main() {
  const conn = new Client();
  conn.on('ready', async () => {
    console.log('✅ SSH connection established');
    try {
      // 1. Ensure remote directory exists
      await runRemote(conn, `mkdir -p ${REMOTE_DIR}`);

      // 2. If the repo is not cloned yet, clone it; otherwise pull latest
      console.log('🔄 Ensuring latest code from GitHub');
      await runRemote(
          conn,
          `if [ -d ${REMOTE_DIR}/.git ]; then\
            cd ${REMOTE_DIR} && git fetch --all && git reset --hard origin/main;\
          elif [ -d ${REMOTE_DIR} ]; then\
            echo "Directory exists but is not a git repo – removing..." && rm -rf ${REMOTE_DIR} && git clone ${GIT_REPO} ${REMOTE_DIR};\
          else\
            git clone ${GIT_REPO} ${REMOTE_DIR};\
          fi`
      );

      // 3. Install backend dependencies
      console.log('📦 Installing backend dependencies');
      await runRemote(conn, `cd ${REMOTE_DIR}/backend && npm ci`);

      // 4. Install frontend dependencies
      console.log('📦 Installing frontend dependencies');
      await runRemote(conn, `cd ${REMOTE_DIR}/frontend && npm ci`);

      // 5. Build backend (NestJS) and generate Prisma client
      console.log('🔨 Building backend');
      await runRemote(conn, `cd ${REMOTE_DIR}/backend && npx prisma generate && npm run build`);

      // 6. Build frontend (Next.js) for production
      console.log('🔨 Building frontend');
      await runRemote(conn, `cd ${REMOTE_DIR}/frontend && npm run build`);

      // 7. Restart services with PM2
      console.log('🚀 Restarting processes with PM2');
      await runRemote(conn, `pm2 delete optik-backend || true`);
      await runRemote(conn, `pm2 delete optik-frontend || true`);
      await runRemote(conn, `cd ${REMOTE_DIR}/backend && pm2 start dist/app.js --name optik-backend`);
      await runRemote(conn, `cd ${REMOTE_DIR}/frontend && pm2 start npm --name optik-frontend -- start`);

      console.log('✅ Deployment completed successfully');
    } catch (e) {
      console.error('❌ Deployment error:', e.message);
    } finally {
      conn.end();
    }
  })
    .on('error', (err) => {
      console.error('❌ SSH connection error:', err.message);
    })
    .connect(config);
}

if (require.main === module) {
  main();
}
// --------------------------------------------------------------
// End of deploy_vps_github.js
// --------------------------------------------------------------
