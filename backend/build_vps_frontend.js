const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    console.log('Running: cd /var/www/optik/frontend && npm run build');
    conn.exec('cd /var/www/optik/frontend && npm run build', (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.on('stderr', (d) => process.stderr.write(d));
        stream.on('close', (code) => {
            console.log(`Frontend build finished with code ${code}`);
            conn.end();
        });
    });
}).connect(config);
