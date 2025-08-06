const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Create a share link for a folder
router.post('/create/:folderId', ensureAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { duration } = req.body; // duration in days
    
    // Check if user owns the folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });
    
    if (!folder || folder.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
    
    // Create or update share link
    const shareLink = await prisma.shareLink.upsert({
      where: { folderId },
      update: { expiresAt },
      create: {
        folderId,
        expiresAt
      }
    });
    
    res.json({ 
      shareUrl: `${req.protocol}://${req.get('host')}/share/${shareLink.id}`,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// View shared folder (public access)
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const shareLink = await prisma.shareLink.findUnique({
      where: { id: shareId },
      include: {
        folder: {
          include: { files: true }
        }
      }
    });
    
    if (!shareLink) {
      return res.status(404).render('error', { message: 'Share link not found' });
    }
    
    if (new Date() > shareLink.expiresAt) {
      return res.status(410).render('error', { message: 'Share link has expired' });
    }
    
    res.render('share/view', { 
      folder: shareLink.folder, 
      shareId,
      isOwner: req.isAuthenticated() && req.user.id === shareLink.folder.userId
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load shared folder' });
  }
});

// Delete share link (folder owner only)
router.delete('/:folderId', ensureAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });
    
    if (!folder || folder.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await prisma.shareLink.delete({
      where: { folderId }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

module.exports = router; 