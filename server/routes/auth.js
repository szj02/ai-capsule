const express = require('express');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../auth');

const router = express.Router();

// GET /auth/github -> redirects the browser to GitHub's OAuth consent screen.
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user'
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GET /auth/github/callback -> GitHub redirects here with a ?code=...
// We exchange that code for a GitHub access token, fetch the GitHub
// profile, then issue OUR OWN application JWT and set it as a
// Secure, HttpOnly cookie named "token".
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/login?error=missing_code');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.redirect('/login?error=token_exchange_failed');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-capsule-app'
      }
    });

    const githubUser = await userRes.json();

    if (!githubUser || !githubUser.id) {
      console.error('GitHub user fetch failed:', githubUser);
      return res.redirect('/login?error=profile_fetch_failed');
    }

    const appUser = {
      id: String(githubUser.id), // this becomes user_id on every capsule
      username: githubUser.login,
      name: githubUser.name || githubUser.login
    };

    const appToken = generateToken(appUser);

    res.cookie('token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('/login?error=server_error');
  }
});

// POST /auth/logout -> clears the cookie.
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /auth/me -> lets the React app check "am I logged in?" and who as.
router.get('/me', (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;
