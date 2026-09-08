require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
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



const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.etoo1jt.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?appName=shop`;

const app = express();

// Only build the network-backed session store when run as the entrypoint;
// on bare require() (tests) express-session falls back to its MemoryStore.
const store = require.main === module
    ? new mongodbStore({ uri: MONGODB_URI, collection: 'sessions' })
    : undefined;
const csrfProtection = csrf();



const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }


};
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({ secret: 'this is a secret', resave: false, saveUninitialized: false, store: store }));


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


app.use(errorController.get404);
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
    mongoose.connect(MONGODB_URI)
        .then(() => app.listen(process.env.PORT || 3000))
        .catch(err => console.log(err));
}

module.exports = app;