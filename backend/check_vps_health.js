const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    conn.exec('curl http://localhost:3000/health', (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect(config);
