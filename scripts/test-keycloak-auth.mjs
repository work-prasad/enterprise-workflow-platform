
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';

const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const REALM = 'enterprise-workflow';
const CLIENT_ID = 'ewp-web';
const REDIRECT_URI = 'http://localhost:3001/callback';
const API_URL = 'http://localhost:3000/health/me';

const issuer = `${KEYCLOAK_BASE_URL}/realms/${REALM}`;

function base64Url(buffer) {
  return buffer.toString('base64url');
}

function createPkce() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(
    crypto.createHash('sha256').update(verifier).digest(),
  );

  return { verifier, challenge };
}

async function main() {
  const { verifier, challenge } = createPkce();
  const state = crypto.randomBytes(16).toString('hex');

  const authorizationUrl = new URL(
    `${issuer}/protocol/openid-connect/auth`,
  );

  authorizationUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid',
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  }).toString();

  let callbackServer;

  try {
    const callbackResult = new Promise((resolve, reject) => {
      callbackServer = http.createServer((req, res) => {
        const callbackUrl = new URL(req.url, REDIRECT_URI);

        if (callbackUrl.pathname !== '/callback') {
          res.writeHead(404).end();
          return;
        }

        const returnedState = callbackUrl.searchParams.get('state');
        const code = callbackUrl.searchParams.get('code');
        const error = callbackUrl.searchParams.get('error');

        if (returnedState !== state) {
          res.writeHead(400).end('OAuth state validation failed.');
          reject(new Error('OAuth state mismatch'));
          return;
        }

        if (error || !code) {
          res.writeHead(400).end('Keycloak login failed.');
          reject(new Error(`Keycloak error: ${error ?? 'Missing code'}`));
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
        });
        res.end('<h2>Login received. You can return to the terminal.</h2>');

        resolve(code);
      });

      callbackServer.once('error', reject);
      callbackServer.listen(3001);
    });

    await new Promise((resolve, reject) => {
      callbackServer.once('listening', resolve);
      callbackServer.once('error', reject);
    });

    console.log('Opening Keycloak login...');
    
    const browser = spawn(
  'rundll32.exe',
  ['url.dll,FileProtocolHandler', authorizationUrl.href],
  {
    detached: true,
    stdio: 'ignore',
  },
);

browser.unref();

    console.log('Complete login in your browser.');

    const code = await callbackResult;

    console.log('Authorization code received; exchanging once...');

    const tokenResponse = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        `Token exchange failed: ${tokenData.error ?? tokenResponse.status} - ${
          tokenData.error_description ?? 'No access token returned'
        }`,
      );
    }

    console.log('Access token received successfully.');

    const apiResponse = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(
        `Protected API returned HTTP ${apiResponse.status}: ${
          apiData.message ?? 'Unknown error'
        }`,
      );
    }

    console.log('Protected API authentication successful.');
    console.log('API response:', apiData);
  } finally {
    callbackServer?.close();
  }
}

main().catch((error) => {
  console.error('Authentication test failed:', error.message);
  process.exitCode = 1;
});
