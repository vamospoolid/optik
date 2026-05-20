const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const conn = new Client();

// VPS Connection Config
const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

const REMOTE_DIR = '/var/www/optik88';
const DOMAIN = 'optik.codenusa.id';

function runRemoteCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`📡 [VPS] Executing: ${command}`);
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}

function uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            console.log(`📤 [SFTP] Uploading ${path.basename(localPath)} to ${remotePath}...`);
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ [SFTP] Successfully uploaded ${path.basename(localPath)}`);
                    resolve();
                }
            });
        });
    });
}

conn.on('ready', async () => {
    console.log('✅ [SSH] Connected to VPS!');
    try {
        // Step 1: Configure Virtual Memory (Swap File) & Upgrade Node.js & Install Deps
        console.log('🧠 Configuring 2GB Virtual Memory (Swap File) to prevent build freezes...');
        await runRemoteCommand('if [ ! -f /swapfile ]; then fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048; chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile; echo "/swapfile none swap sw 0 0" >> /etc/fstab; echo "Swap created!"; else echo "Swap already exists."; fi');

        console.log('📦 Upgrading Node.js to version 20 (Required for Next.js 16)...');
        await runRemoteCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
        await runRemoteCommand('apt-get install -y nodejs');
        
        console.log('📦 Installing System Dependencies (PostgreSQL, Nginx, Unzip)...');
        await runRemoteCommand('apt-get update && apt-get install -y postgresql postgresql-contrib nginx unzip');

        // Step 2: Enable & Start services
        console.log('⚙️ Starting and enabling Nginx & PostgreSQL...');
        await runRemoteCommand('systemctl start postgresql && systemctl enable postgresql');
        await runRemoteCommand('systemctl start nginx && systemctl enable nginx');

        // Step 3: Configure Database (postgres user password 'admin' and create database 'optikpro')
        console.log('🐘 Configuring PostgreSQL Database...');
        // We run commands safely. Note: ALTER USER and CREATE DATABASE might throw if already done, we catch error or execute safely
        await runRemoteCommand('sudo -u postgres psql -c "ALTER USER postgres PASSWORD \'admin\';" || true');
        await runRemoteCommand('sudo -u postgres psql -c "CREATE DATABASE optikpro;" || true');

        // Step 4: Create remote folder
        console.log(`📁 Creating remote directory ${REMOTE_DIR}...`);
        await runRemoteCommand(`mkdir -p ${REMOTE_DIR}`);

        // Step 5: Zip local folders (Excluding node_modules, builds)
        console.log('🤐 Zipping backend on local machine...');
        execSync('powershell -Command "Get-ChildItem -Path ..\\backend -Exclude node_modules, dist, .prisma, check_new_vps.js | Compress-Archive -DestinationPath ..\\backend.zip -Update"', { cwd: path.join(__dirname) });
        
        console.log('🤐 Zipping frontend on local machine...');
        execSync('powershell -Command "Get-ChildItem -Path ..\\frontend -Exclude node_modules, .next, out | Compress-Archive -DestinationPath ..\\frontend.zip -Update"', { cwd: path.join(__dirname) });

        // Step 6: Upload ZIP files to VPS
        const localBackendZip = path.join(__dirname, '..', 'backend.zip');
        const localFrontendZip = path.join(__dirname, '..', 'frontend.zip');
        await uploadFile(localBackendZip, `${REMOTE_DIR}/backend.zip`);
        await uploadFile(localFrontendZip, `${REMOTE_DIR}/frontend.zip`);

        // Step 7: Clean old files & Extract Zips on VPS
        console.log('🔓 Extracting packages on VPS...');
        await runRemoteCommand(`rm -rf ${REMOTE_DIR}/backend ${REMOTE_DIR}/frontend`);
        await runRemoteCommand(`mkdir -p ${REMOTE_DIR}/backend ${REMOTE_DIR}/frontend`);
        await runRemoteCommand(`unzip -o ${REMOTE_DIR}/backend.zip -d ${REMOTE_DIR}/backend || true`);
        await runRemoteCommand(`unzip -o ${REMOTE_DIR}/frontend.zip -d ${REMOTE_DIR}/frontend || true`);
        await runRemoteCommand(`rm -f ${REMOTE_DIR}/backend.zip ${REMOTE_DIR}/frontend.zip`);

        // Step 8: Create production .env file in backend on VPS
        console.log('📝 Creating backend .env file on VPS...');
        const envContent = `
# Database Configuration
DATABASE_URL="postgresql://postgres:admin@localhost:5432/optikpro?schema=public"

# Auth Configuration
JWT_ACCESS_SECRET="optikpro_access_secret_2026_!@#"
JWT_REFRESH_SECRET="optikpro_refresh_secret_2026_!@#"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Security Configuration
ENCRYPTION_KEY="12345678901234567890123456789012"
ENCRYPTION_IV="1234567890123456"

# Port
PORT=3001
`;
        // Write the env file safely
        await runRemoteCommand(`cat << 'EOF' > ${REMOTE_DIR}/backend/.env\n${envContent}\nEOF`);

        // Step 9: Install package dependencies on VPS
        console.log('📦 Installing backend npm packages on VPS...');
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && npm install`);

        console.log('📦 Installing frontend npm packages on VPS...');
        await runRemoteCommand(`cd ${REMOTE_DIR}/frontend && npm install`);

        // Step 10: Compile backend & Migrate Database
        console.log('🔨 Compiling NestJS Backend & Setting up Database Schema...');
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && npx prisma generate`);
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && npx prisma migrate deploy`);
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && npm run build`);
        
        // Seed Database with administrative and mock data
        console.log('🌱 Seeding database...');
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && npx ts-node src/seed.ts || npx prisma db seed || true`);

        // Step 11: Build Frontend with production environment variables
        console.log(`🔨 Building NextJS Frontend for domain ${DOMAIN}...`);
        await runRemoteCommand(`cd ${REMOTE_DIR}/frontend && NEXT_PUBLIC_API_URL=http://${DOMAIN} npm run build`);

        // Step 12: Configure Nginx Reverse Proxy on VPS
        console.log('🌐 Configuring Nginx Reverse Proxy for apotek.codenusa.id...');
        const nginxConfig = `
server {
    listen 80;
    server_name ${DOMAIN};

    # Next.js Frontend reverse proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Nest.js Backend API reverse proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
        await runRemoteCommand(`cat << 'EOF' > /etc/nginx/sites-available/optik88\n${nginxConfig}\nEOF`);
        await runRemoteCommand('rm -f /etc/nginx/sites-enabled/default');
        await runRemoteCommand('ln -sf /etc/nginx/sites-available/optik88 /etc/nginx/sites-enabled/');
        await runRemoteCommand('nginx -t && systemctl reload nginx');

        // Step 13: PM2 Application Process Management
        console.log('🚀 Running Backend and Frontend under PM2 process management...');
        // Backend PM2
        await runRemoteCommand('pm2 delete optik-backend || true');
        await runRemoteCommand(`cd ${REMOTE_DIR}/backend && pm2 start dist/app.js --name optik-backend`);
        
        // Frontend PM2
        await runRemoteCommand('pm2 delete optik-frontend || true');
        await runRemoteCommand(`cd ${REMOTE_DIR}/frontend && pm2 start npm --name "optik-frontend" -- start`);

        // Save PM2 configuration to restart automatically on VPS boot
        await runRemoteCommand('pm2 save');

        console.log('\n🌟🌟🌟 DEPLOYMENT COMPLETED SUCCESSFULLY! 🌟🌟🌟');
        console.log(`Subdomain: http://${DOMAIN}`);
        console.log('API Endpoint: http://' + DOMAIN + '/api/v1');
        console.log('Initial Admin Account:');
        console.log('  - Email: admin@optik88.com');
        console.log('  - Password: password123');
        console.log('\n⚠️  PENTING: Jangan lupa arahkan DNS A Record domain "codenusa.id" untuk subdomain "apotek" ke IP: 173.212.243.240 di penyedia domain Anda!');

        conn.end();
    } catch (error) {
        console.error('❌ [DEPLOYMENT ERROR]:', error);
        conn.end();
    }
}).on('error', (err) => {
    console.error('❌ [SSH CONNECTION ERROR]:', err);
}).connect(config);
