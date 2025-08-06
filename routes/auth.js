const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) return res.redirect('/signup');

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, password: hashed }
  });
  res.redirect('/login');
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
});

module.exports = router;