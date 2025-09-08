const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Validate required env vars (warn-only for SMTP + admin)
const requiredEmailEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'ADMIN_EMAIL',
];

const missing = requiredEmailEnv.filter((k) => !process.env[k] || process.env[k].trim() === '');
if (missing.length) {
  // Do not log sensitive values
  console.warn(
    'Email sending not configured. Missing env vars: ' + missing.join(', ') +
      '. The app will run, but booking emails will not be sent until configured.'
  );
}

const app = express();
const isDev = (process.env.NODE_ENV || 'development') === 'development';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy for accurate req.ip behind proxies
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (serve built CSS and images)
const publicPath = path.join(__dirname, '..', 'public');
const assetsPath = path.join(publicPath, 'assets');
app.use(express.static(publicPath));
app.use('/assets', express.static(assetsPath));

// Security headers with minimal CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// CORS (sensible default: same-origin unless env provided)
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Logging (avoid logging sensitive info; morgan logs method/url/status)
app.use(morgan(isDev ? 'dev' : 'combined'));

// Small helper to render views within a shared layout
function renderWithLayout(req, res, view, data = {}) {
  req.app.render(view, data, (err, html) => {
    if (err) {
      const message = isDev ? `Template error: ${err.message}` : 'An unexpected error occurred.';
      return res.status(500).render('error', { message, error: isDev ? err : null });
    }
    res.render('layout', { ...data, body: html });
  });
}

// Routes
const bookingRouter = require('./routes/booking');

app.get('/', (req, res) => {
  renderWithLayout(req, res, 'index', { title: 'Book a Taxi', formData: {}, errors: {} });
});

app.use('/', bookingRouter(renderWithLayout));

// 404 handler
app.use((req, res) => {
  res.status(404);
  renderWithLayout(req, res, 'error', {
    title: 'Not Found',
    message: 'The page you are looking for was not found.',
    error: isDev ? { status: 404 } : null,
  });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred.';
  res.status(status);
  renderWithLayout(req, res, 'error', { title: 'Error', message, error: isDev ? err : null });
});

app.listen(PORT, () => {
  console.log(`Taxi Booking app listening on http://localhost:${PORT}`);
});
