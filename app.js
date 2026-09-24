require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const https = require('https');

const errorController = require('./controllers/errorController');

const User = require('./models/user');

const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);



const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

const MONGODB_URI = process.env.MONGODB_URI || (
    process.env.MONGO_USER && process.env.MONGO_PASSWORD && process.env.MONGO_DEFAULT_DATABASE
        ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.etoo1jt.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?appName=shop`
        : ''
);

const app = express();
const connectToDatabase = require('./util/db');

// Trust reverse proxy (Vercel, Nginx, etc.) for secure cookie detection and client IP
app.set('trust proxy', 1);

// Serverless DB connection middleware ensuring DB is ready before request processing
app.use(async (req, res, next) => {
    if (isTest || mongoose.connection.readyState >= 1) {
        return next();
    }
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('[DB Connection Middleware Error]:', err);
        return res.status(500).json({
            message: 'Database connection failed',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        });
    }
});

// Network-backed session store in production / outside tests;
// Express-session falls back to MemoryStore during tests
let store;
if (!isTest && MONGODB_URI) {
    store = new mongodbStore({
        uri: MONGODB_URI,
        collection: 'sessions'
    });
    store.on('error', (err) => {
        console.error('[Session Store Error]:', err);
    });
}
const csrfProtection = csrf();

const os = require('os');
const uploadDir = process.env.VERCEL ? os.tmpdir() : 'images';

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(compression());

if (process.env.VERCEL) {
    app.use(morgan('combined'));
} else {
    try {
        const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
        app.use(morgan('combined', { stream: accessLogStream }));
    } catch {
        app.use(morgan('combined'));
    }
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'this is a secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        httpOnly: true,
        secure: 'auto',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {

            if (!user) {
                return next();
            }

            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });

});
app.use(csrfProtection);
app.use(flash());

app.use('/api', require('./routes/api'));

const SPA_DIR = path.join(__dirname, 'public', 'app');
app.use(express.static(SPA_DIR));
app.get(/^\/(?!api(?:\/|$)|images(?:\/|$)).*/, (req, res) => {
    const indexFile = path.join(SPA_DIR, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    res.status(503).json({ message: 'SPA build not found. Run: cd client && npm run build' });
});


app.use(errorController.get404);
app.use((error, req, res, next) => {
    if (error.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ message: 'Invalid CSRF token', code: 'EBADCSRFTOKEN' });
    }
    const status = error.status || error.httpStatusCode || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ message: status >= 500 ? 'Internal server error' : (error.message || 'Request failed') });
});

if (require.main === module) {
    connectToDatabase()
        .then(() => {
            const port = process.env.PORT || 3000;
            app.listen(port, () => console.log(`Server listening on port ${port}`));
        })
        .catch(err => console.error('[Bootstrap Error]:', err));
}

module.exports = app;