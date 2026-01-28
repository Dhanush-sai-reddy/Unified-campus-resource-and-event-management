
const http = require('http');

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function run() {
    console.log('1. Logging in...');
    const loginPayload = JSON.stringify({ email: 'admin@campus.edu', password: 'password123' });

    // Login to API directly on 5000
    try {
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginPayload.length
            }
        }, loginPayload);

        if (loginRes.status !== 200) {
            console.error('Login Failed:', loginRes.status, loginRes.body);
            return;
        }

        const loginData = JSON.parse(loginRes.body);
        const token = loginData.token;
        console.log('Login successful.');

        console.log('2. Fetching Resources...');
        const resRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/resources',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Resources Status:', resRes.status);
        if (resRes.status === 200) {
            const resources = JSON.parse(resRes.body);
            console.log('Resources found:', resources.length);
        } else {
            console.error('Failed to get resources:', resRes.body);
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
