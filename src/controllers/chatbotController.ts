import { NextFunction, Request, Response } from 'express';
import { askChatbot } from '../services/chatbotService';
import { parseChatMessage } from '../validators/chatbotValidator';

export const postChatMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const message = parseChatMessage(req.body);
        const reply = await askChatbot(message);

        res.status(200).json({
            success: true,
            data: { reply },
        });
    } catch (error) {
        next(error);
    }
};