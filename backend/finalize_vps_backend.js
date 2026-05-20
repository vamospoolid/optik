const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    const commands = [
        'cd /var/www/optik/backend && npm run build',
        'cd /var/www/optik/backend && npx prisma generate',
        'cd /var/www/optik/backend && npx prisma migrate deploy',
        'cd /var/www/optik/backend && pm2 delete optik-backend || true',
        'cd /var/www/optik/backend && pm2 start dist/app.js --name optik-backend'
    ];
    
    function runNext(index) {
        if (index >= commands.length) {
            console.log('Backend finalized and started!');
            conn.end();
            return;
        }
        console.log(`Running: ${commands[index]}`);
        conn.exec(commands[index], (err, stream) => {
            if (err) throw err;
            stream.on('data', (d) => process.stdout.write(d));
            stream.on('stderr', (d) => process.stderr.write(d));
            stream.on('close', (code) => {
                console.log(`Command finished with code ${code}`);
                runNext(index + 1);
            });
        });
    }
    
    runNext(0);
}).connect(config);
