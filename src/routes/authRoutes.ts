import { Router } from 'express';
import { getMe, patchProfile, signOut } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// UC2: Sign in verification - frontend calls this right after the OAuth
// redirect (Google/Facebook) completes, passing the access_token Supabase
// handed back, to confirm it's valid and fetch the user + profile.
router.get('/me', getMe);

// UC1: second half of registration - collects phone / default address that Google/Facebook 
// don't provide.
router.patch('/profile', requireAuth, patchProfile);

// UC3: Sign out
router.post('/logout', requireAuth, signOut);

export default router;
