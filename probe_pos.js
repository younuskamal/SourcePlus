
const https = require('https');

const options = {
    hostname: 'sourceplus.onrender.com',
    port: 443,
    path: '/api/pos/validate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(JSON.stringify({
    serial: 'test',
    hardwareId: 'test'
}));
req.end();
