
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
        console.log('Login successful. Token obtained.');

        console.log('2. Attempting Create Event (Multi-Day Proof)...');

        const d = new Date();
        const startStr = d.toISOString();
        const endDate = new Date(d);
        endDate.setDate(d.getDate() + 2); // 2 days later
        const endStr = endDate.toISOString();

        const eventPayload = JSON.stringify({
            title: 'Multi-Day Proof',
            description: 'This event should span 3 days.',
            date: startStr,
            endDate: endStr,
            location: 'Test Location',
            budget: 0,
            isMultiDay: true
        });

        const createRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/events',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': eventPayload.length
            }
        }, eventPayload);

        console.log('Create Event Status:', createRes.status);
        console.log('Response Body:', createRes.body);

    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
