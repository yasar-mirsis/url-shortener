import { Response } from 'express';
import { getShortCode, incrementClick } from '../services/urlService';

/**
 * Handle redirect requests for a short code
 */
export const handleRedirect = async (code: string, res: Response): Promise<void> => {
  try {
    const urlData = await getShortCode(code);
    
    if (!urlData) {
      res.status(404).json({ error: 'Short code not found' });
      return;
    }
    
    // Increment click count
    await incrementClick(code);
    
    // Redirect to original URL
    res.redirect(302, urlData.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
