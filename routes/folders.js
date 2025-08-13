const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.get('/', ensureAuth, async (req, res) => {
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    include: { files: true }
  });
  res.render('folders/index', { user: req.user, folders });
});

router.get('/new', ensureAuth, (req, res) => {
  res.render('folders/new');
});

router.post('/new', ensureAuth, async (req, res) => {
  const { name } = req.body;
  await prisma.folder.create({
    data: {
      name,
      userId: req.user.id
    }
  });
  res.redirect('/folders');
});

router.get('/:id', ensureAuth, async (req, res) => {
  const folder = await prisma.folder.findUnique({
    where: { id: req.params.id },
    include: { files: true }
  });
  if (!folder || folder.userId !== req.user.id) return res.redirect('/folders');
  res.render('folders/show', { folder });
});

router.post('/:id/delete', ensureAuth, async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: req.params.id } });
    if (!folder || folder.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await prisma.folder.delete({ where: { id: req.params.id } });
    res.redirect('/folders');
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.redirect('/folders');
  }
});

router.get('/:id/edit', ensureAuth, async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: req.params.id } });
    if (!folder || folder.userId !== req.user.id) {
      return res.redirect('/folders');
    }
    res.render('folders/edit', { folder });
  } catch (error) {
    res.redirect('/folders');
  }
});

router.post('/:id/edit', ensureAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await prisma.folder.findUnique({ where: { id: req.params.id } });
    if (!folder || folder.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await prisma.folder.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.redirect(`/folders/${req.params.id}`);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.redirect('/folders');
  }
});

module.exports = router;