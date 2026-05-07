/**
 * Local login smoke test. Set credentials via env, do not hardcode passwords.
 * Usage: LOGIN_EMAIL=... LOGIN_PASSWORD=... [API_BASE_URL=...] node test-login.js
 */
const axios = require('axios');

async function testLogin() {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  const port = process.env.PORT || '3000';
  const apiBaseUrl = (
    process.env.API_BASE_URL ||
    process.env.VITE_API_URL ||
    `http://localhost:${port}`
  ).replace(/\/$/, '');

  if (!email || !password) {
    console.error('Set LOGIN_EMAIL and LOGIN_PASSWORD in the environment (or use a copy named test-login.local.js, gitignored).');
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/auth/login`,
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
