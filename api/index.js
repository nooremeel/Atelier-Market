const app = require('../app');
const connectToDatabase = require('../util/db');

module.exports = async (req, res) => {
  // Normalize path if Vercel rewrite passes URL without /api prefix
  if (!req.url.startsWith('/api') && !req.url.startsWith('/images')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  try {
    await connectToDatabase();
  } catch (err) {
    console.error('[Vercel Serverless Function DB Error]:', err);
    return res.status(500).json({
      message: 'Failed to connect to database',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  }

  return app(req, res);
};
