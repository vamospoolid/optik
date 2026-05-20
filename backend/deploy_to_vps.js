const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmaddcc07'
};

const REMOTE_DIR = '/var/www/optik';

async function runRemoteCommand(command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                if (code === 0) resolve(output);
                else reject(new Error(`Command failed with code ${code}`));
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}

async function uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            console.log(`Uploading ${localPath} to ${remotePath}...`);
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

conn.on('ready', async () => {
    console.log('✅ SSH Connected!');
    try {
        // 1. Create directory
        console.log(`Creating directory ${REMOTE_DIR}...`);
        await runRemoteCommand(`mkdir -p ${REMOTE_DIR}`);

        // 2. Zip local files (excluding node_modules)
        console.log('📦 Zipping backend...');
        execSync('powershell -Command "Get-ChildItem -Path ..\\backend -Exclude node_modules, dist, .prisma | Compress-Archive -DestinationPath ..\\backend.zip -Update"', { cwd: path.join(__dirname) });

        console.log('📦 Zipping frontend...');
        execSync('powershell -Command "Get-ChildItem -Path ..\\frontend -Exclude node_modules, .next, out | Compress-Archive -DestinationPath ..\\frontend.zip -Update"', { cwd: path.join(__dirname) });

        // 3. Upload zips
        await uploadFile(path.join(__dirname, '..', 'backend.zip'), `${REMOTE_DIR}/backend.zip`);
        await uploadFile(path.join(__dirname, '..', 'frontend.zip'), `${REMOTE_DIR}/frontend.zip`);

        // 4. Extract on VPS
        console.log('🔓 Extracting on VPS...');
        await runRemoteCommand(`apt-get install -y unzip && cd ${REMOTE_DIR} && unzip -o backend.zip -d backend && unzip -o frontend.zip -d frontend && rm backend.zip frontend.zip`);

        console.log('🚀 Deployment step 1 (Upload) Complete!');
        console.log('Next steps: Install dependencies and build on VPS.');

        conn.end();
    } catch (error) {
        console.error('❌ Error:', error);
        conn.end();
    }
}).connect(config);
