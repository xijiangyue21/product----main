/**
 * Local login smoke test — set credentials via env, do not hardcode passwords.
 * Usage: LOGIN_EMAIL=... LOGIN_PASSWORD=... node test-login.js
 */
const axios = require('axios');

async function testLogin() {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  if (!email || !password) {
    console.error('Set LOGIN_EMAIL and LOGIN_PASSWORD in the environment (or use a copy named test-login.local.js, gitignored).');
    process.exit(1);
  }
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/login',
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testLogin();
