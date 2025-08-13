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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId } = req.body;
    const { originalname, size } = req.file;
    
    // Get Cloudinary URL from the uploaded file
    const cloudinaryUrl = req.file.path;
    
    // Validate folder ownership if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || folder.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to this folder' });
      }
    }

    const file = await prisma.file.create({
      data: {
        name: originalname,
        size,
        path: req.file.filename || originalname, // Keep original filename for reference
        url: cloudinaryUrl, // Store Cloudinary URL
        folderId: folderId || null,
        userId: req.user.id,
      }
    });
    
    // Redirect to the folder if specified, otherwise to root
    if (folderId) {
      res.redirect(`/folders/${folderId}`);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id) return res.redirect('/');
  res.render('files/show', { file });
});

router.get('/download/:id', ensureAuth, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id) return res.redirect('/');
  
  // If we have a Cloudinary URL, redirect to it for download
  if (file.url) {
    res.redirect(file.url);
  } else {
    // Fallback to local file if no cloud URL (for backward compatibility)
    const filepath = path.join(__dirname, '..', 'uploads', file.path);
    if (fs.existsSync(filepath)) {
      res.download(filepath, file.name);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  }
});

router.post('/delete/:id', ensureAuth, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file || file.userId !== req.user.id) return res.redirect('/');
    
    // Note: With Cloudinary, files are automatically managed
    // You could add cloudinary.uploader.destroy() here if you want to delete from cloud storage
    
    // Delete from database
    await prisma.file.delete({ where: { id: req.params.id } });
    
    // Redirect to the folder if specified, otherwise to root
    if (file.folderId) {
      res.redirect(`/folders/${file.folderId}`);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.redirect('/');
  }
});

module.exports = router;