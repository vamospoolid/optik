const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07' };

conn.on('ready', () => {
    console.log('✅ SSH Connected!');
    const commands = [
        'cd /var/www/optik88/backend && npm install',
        'cd /var/www/optik88/frontend && npm install'
    ];
    
    function runNext(index) {
        if (index >= commands.length) {
            console.log('All dependencies installed!');
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
