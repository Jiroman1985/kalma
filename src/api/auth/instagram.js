export default function handler(req, res) {
  const { FACEBOOK_APP_ID, INSTAGRAM_REDIRECT_URI } = process.env;

  const oauthUrl = [
    'https://www.facebook.com/v17.0/dialog/oauth',
      `?client_id=${FACEBOOK_APP_ID}`,
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}`,
      '&response_type=code',
      '&scope=pages_show_list,instagram_basic,instagram_manage_comments'
  ].join('');

  // redirigimos al OAuth de FB
  res.writeHead(302, { Location: oauthUrl });
  res.end();
} 