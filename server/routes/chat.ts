import { Router } from 'express';
import { dbRepository } from '../db/repository.js';
import { runAgentConversation } from '../agent/agentLoop.js';

const router = Router();

// List all conversations
router.get('/conversations', (req, res) => {
  try {
    const list = dbRepository.getConversations();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new conversation
router.post('/conversations', (req, res) => {
  try {
    const title = req.body.title || 'Dropshipping Strategy Session';
    const convo = dbRepository.createConversation(title);
    res.status(201).json(convo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', (req, res) => {
  try {
    const messages = dbRepository.getMessages(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post user message and trigger agent loop
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const agentResult = await runAgentConversation(conversationId, content);
    res.json(agentResult);
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Internal Agent Error' });
  }
});

export default router;
