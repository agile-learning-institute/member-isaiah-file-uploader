require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PrismaStore = require('@quixo3/prisma-session-store').PrismaSessionStore;
const passport = require('passport');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const folderRoutes = require('./routes/folders');
const shareRoutes = require('./routes/share');

require('./passport-config')(passport);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PrismaStore({
    prisma,
    checkPeriod: 2 * 60 * 1000
  })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRoutes);
app.use('/files', fileRoutes);
app.use('/folders', folderRoutes);
app.use('/share', shareRoutes);

app.get('/', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.render('index', { user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
