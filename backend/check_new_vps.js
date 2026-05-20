const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
};

conn.on('ready', () => {
    console.log('✅ Connected to new VPS via SSH!');
    const commands = [
        'echo "=== Remote Folder ===" && ls -lh /var/www/optik88',
        'echo "=== Backend Files ===" && ls -lh /var/www/optik88/backend',
        'echo "=== Test Unzip Backend ===" && unzip -t /var/www/optik88/backend.zip || echo "Backend zip not found or invalid"',
        'echo "=== Test Unzip Frontend ===" && unzip -t /var/www/optik88/frontend.zip || echo "Frontend zip not found or invalid"'
    ];

    function runNext(index) {
        if (index >= commands.length) {
            console.log('=== Checks Complete ===');
            conn.end();
            return;
        }
        conn.exec(commands[index], (err, stream) => {
            if (err) {
                console.error(`Error executing ${commands[index]}:`, err);
                runNext(index + 1);
                return;
            }
            stream.on('data', (d) => process.stdout.write(d));
            stream.on('stderr', (d) => process.stderr.write(d));
            stream.on('close', (code) => {
                runNext(index + 1);
            });
        });
    }

    runNext(0);
}).on('error', (err) => {
    console.error('❌ SSH Connection Error:', err);
}).connect(config);
