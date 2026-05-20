// deploy_full.js
// -------------------------------------------------------------------
// Script all-in-one: Push ke GitHub → Deploy ke VPS dari GitHub
// Jalankan: node deploy_full.js "pesan commit"
// Atau tanpa push GitHub: node deploy_full.js --skip-github
// -------------------------------------------------------------------

const { Client } = require('ssh2');
const { execSync } = require('child_process');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────
const PROJECT_ROOT = path.join(__dirname, '..');
const GITHUB_REPO = 'https://github.com/vamospoolid/optik.git';
const BRANCH = 'main';

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
};

const REMOTE_DIR = '/var/www/optik88';
const DOMAIN = 'optik.codenusa.id';

// ─── Helpers ─────────────────────────────────────────────────────
function runLocal(cmd, options = {}) {
    const opts = { cwd: PROJECT_ROOT, stdio: 'inherit', encoding: 'utf-8', ...options };
    console.log(`  🖥️  [LOCAL] ${cmd}`);
    return execSync(cmd, opts);
}

function runLocalSilent(cmd) {
    try {
        return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
    } catch { return ''; }
}

function runRemote(conn, cmd) {
    return new Promise((resolve, reject) => {
        console.log(`  📡 [VPS] ${cmd}`);
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '';
            let stderr = '';
            stream
                .on('close', (code) => {
                    if (code === 0) resolve(stdout.trim());
                    else reject(new Error(`VPS command failed (code ${code}): ${stderr.trim()}`));
                })
                .on('data', (data) => { stdout += data; process.stdout.write(data); })
                .stderr.on('data', (data) => { stderr += data; process.stderr.write(data); });
        });
    });
}

// ─── Phase 1: Push ke GitHub ─────────────────────────────────────
async function pushToGitHub(commitMessage) {
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  PHASE 1: PUSH KE GITHUB                       │');
    console.log('└─────────────────────────────────────────────────┘');

    const status = runLocalSilent('git status --porcelain');

    if (!status) {
        console.log('  ✅ Tidak ada perubahan - skip push.');
        return;
    }

    const lines = status.split('\n').filter(Boolean);
    console.log(`  📊 ${lines.length} file berubah`);

    runLocal('git add -A');
    runLocal(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    runLocal(`git push -u origin ${BRANCH}`);

    console.log('  ✅ Push ke GitHub berhasil!\n');
}

// ─── Phase 2: Deploy ke VPS ──────────────────────────────────────
async function deployToVPS() {
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  PHASE 2: DEPLOY KE VPS DARI GITHUB             │');
    console.log('└─────────────────────────────────────────────────┘');

    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', async () => {
            console.log('  ✅ SSH Connected ke VPS!');
            try {
                // 2.1 Ensure directory
                await runRemote(conn, `mkdir -p ${REMOTE_DIR}`);

                // 2.2 Pull latest from GitHub
                console.log('\n  🔄 Pulling kode terbaru dari GitHub...');
                await runRemote(conn,
                    `if [ -d ${REMOTE_DIR}/.git ]; then ` +
                    `cd ${REMOTE_DIR} && git fetch --all && git reset --hard origin/${BRANCH}; ` +
                    `elif [ -d ${REMOTE_DIR} ]; then ` +
                    `rm -rf ${REMOTE_DIR} && git clone ${GITHUB_REPO} ${REMOTE_DIR}; ` +
                    `else ` +
                    `git clone ${GITHUB_REPO} ${REMOTE_DIR}; fi`
                );

                // 2.3 Install backend dependencies
                console.log('\n  📦 Installing backend dependencies...');
                await runRemote(conn, `cd ${REMOTE_DIR}/backend && npm ci --omit=dev || npm install --omit=dev`);

                // 2.4 Prisma generate & migrate
                console.log('\n  🗄️ Setting up database...');
                await runRemote(conn, `cd ${REMOTE_DIR}/backend && npx prisma generate`);
                await runRemote(conn, `cd ${REMOTE_DIR}/backend && npx prisma migrate deploy || true`);

                // 2.5 Build backend
                console.log('\n  🔨 Building backend (NestJS)...');
                await runRemote(conn, `cd ${REMOTE_DIR}/backend && npm run build`);

                // 2.6 Install frontend dependencies
                console.log('\n  📦 Installing frontend dependencies...');
                await runRemote(conn, `cd ${REMOTE_DIR}/frontend && npm ci || npm install`);

                // 2.7 Build frontend
                console.log('\n  🔨 Building frontend (Next.js)...');
                await runRemote(conn, `cd ${REMOTE_DIR}/frontend && NEXT_PUBLIC_API_URL=http://${DOMAIN} npm run build`);

                // 2.8 Restart PM2 processes
                console.log('\n  🚀 Restarting PM2 processes...');
                await runRemote(conn, `pm2 delete optik-backend || true`);
                await runRemote(conn, `cd ${REMOTE_DIR}/backend && pm2 start dist/app.js --name optik-backend`);
                await runRemote(conn, `pm2 delete optik-frontend || true`);
                await runRemote(conn, `cd ${REMOTE_DIR}/frontend && pm2 start npm --name "optik-frontend" -- start`);
                await runRemote(conn, `pm2 save`);

                console.log('\n  ✅ Deploy ke VPS berhasil!');
                conn.end();
                resolve();
            } catch (err) {
                console.error('  ❌ Deploy error:', err.message);
                conn.end();
                reject(err);
            }
        }).on('error', (err) => {
            console.error('  ❌ SSH error:', err.message);
            reject(err);
        }).connect(VPS_CONFIG);
    });
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const skipGitHub = args.includes('--skip-github');
    const commitMessage = args.filter(a => a !== '--skip-github').join(' ')
        || `Deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

    const startTime = Date.now();

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     🚀 FULL DEPLOYMENT - Optik88                  ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║ 📝 Commit:  ${commitMessage.padEnd(37)}║`);
    console.log(`║ 🌿 Branch:  ${BRANCH.padEnd(37)}║`);
    console.log(`║ 🖥️  VPS:     ${VPS_CONFIG.host.padEnd(37)}║`);
    console.log(`║ 🌐 Domain:  ${DOMAIN.padEnd(37)}║`);
    console.log(`║ ⏭️  GitHub:  ${(skipGitHub ? 'SKIP' : 'PUSH').padEnd(37)}║`);
    console.log('╚═══════════════════════════════════════════════════╝');

    try {
        // Phase 1: Push ke GitHub
        if (!skipGitHub) {
            await pushToGitHub(commitMessage);
        } else {
            console.log('\n⏭️ Skipping GitHub push (--skip-github flag)');
        }

        // Phase 2: Deploy ke VPS
        await deployToVPS();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n╔═══════════════════════════════════════════════════╗');
        console.log('║     🌟 DEPLOYMENT SELESAI!                        ║');
        console.log('╠═══════════════════════════════════════════════════╣');
        console.log(`║ ⏱️  Waktu:   ${(elapsed + ' detik').padEnd(37)}║`);
        console.log(`║ 🔗 GitHub:  ${GITHUB_REPO.slice(0, 37).padEnd(37)}║`);
        console.log(`║ 🌐 Live:    http://${DOMAIN.padEnd(30)}║`);
        console.log(`║ 📡 API:     http://${(DOMAIN + '/api').padEnd(30)}║`);
        console.log('╚═══════════════════════════════════════════════════╝');
    } catch (err) {
        console.error('\n❌ DEPLOYMENT GAGAL:', err.message);
        process.exit(1);
    }
}

main();
