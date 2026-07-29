import { Router } from 'express';
import { postChatMessage } from '../controllers/chatbotController';

const router = Router();

// UC14: ask the chatbot a question about vehicles.
router.post('/', postChatMessage);

export default router;