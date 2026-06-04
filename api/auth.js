module.exports = function handler(req, res) {
  const host = req.headers.host;
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const redirectUri = `${proto}://${host}/api/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo',
    state: Math.random().toString(36).slice(2),
  });

  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};
