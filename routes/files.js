const express = require('express');
const multer = require('../multer-config');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const prisma = new PrismaClient();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.post('/upload', ensureAuth, multer.single('file'), async (req, res) => {
  const { folderId } = req.body;
  const { originalname, size, filename } = req.file;
  const file = await prisma.file.create({
    data: {
      name: originalname,
      size,
      path: filename,
      folderId: folderId || null,
      userId: req.user.id,
    }
  });
  res.redirect(`/folders/${folderId}`);
});

router.get('/:id', ensureAuth, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id) return res.redirect('/');
  res.render('files/show', { file });
});

router.get('/download/:id', ensureAuth, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id) return res.redirect('/');
  const filepath = path.join(__dirname, '..', 'uploads', file.path);
  res.download(filepath, file.name);
});

module.exports = router;