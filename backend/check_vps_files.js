const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '144.91.73.36', port: 22, username: 'root', password: 'Ahmaddcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    conn.exec('ls -lh /var/www/optik', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.exec('cd /var/www/optik && unzip -o frontend.zip -d frontend', (err, stream2) => {
                if (err) throw err;
                stream2.on('data', (d) => process.stdout.write(d));
                stream2.on('close', (code) => {
                    console.log('Frontend unzip exited with code ' + code);
                    conn.end();
                });
            });
        }).on('data', (d) => process.stdout.write(d));
    });
}).connect(config);
