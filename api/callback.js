module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    res.status(400).send(`OAuth error: ${error || 'no code received'}`);
    return;
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json();

  if (data.error) {
    res.status(400).send(`GitHub error: ${data.error}`);
    return;
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });
  const message = `authorization:github:success:${payload}`;

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><body><script>
    (function () {
      var msg = ${JSON.stringify(message)};
      function cb(e) {
        window.opener.postMessage(msg, e.origin);
      }
      window.addEventListener('message', cb, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  <\/script></body></html>`);
};
