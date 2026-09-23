import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { getDb } from './db/client.js';
import { dbRepository } from './db/repository.js';
import chatRouter from './routes/chat.js';
import approvalsRouter from './routes/approvals.js';
import systemRouter from './routes/system.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// Seed initial conversation if none exists
const existingConversations = dbRepository.getConversations();
if (existingConversations.length === 0) {
  const initialSession = dbRepository.createConversation('Dropshipping Strategy & Sourcing');
  dbRepository.addMessage({
    conversation_id: initialSession.id,
    role: 'assistant',
    content: `G'day! I'm **Friday**, your personal AI assistant for your dropshipping business.

I am configured for:
- 🛒 **Store Platform**: \`${config.storePlatform.toUpperCase()}\`
- 🎯 **Target Market**: \`${config.defaultCountry} (${config.defaultCurrency})\`
- 📦 **Niche**: \`${config.defaultNiche}\`
- 🛡️ **Safety Gate**: Active (All listings & ad budgets require explicit approval)

You can ask me to:
1. *"Find trending pet products in Australia"*
2. *"Calculate profit margin for a $70 orthopedic dog bed"*
3. *"Draft a store product listing with SEO metadata"*
4. *"Generate compliant Facebook/Instagram ad angles"*

How can I help you grow today?`,
  });
}

// API Routes
app.use('/api', chatRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/system', systemRouter);

app.listen(config.port, () => {
  console.log(`🚀 Friday Dropshipping AI Server running on http://localhost:${config.port}`);
  console.log(`🤖 LLM Mode: ${config.anthropicApiKey ? `Live Claude (${config.anthropicModel})` : 'Smart Sandbox Simulator'}`);
  console.log(`🛡️ Store Platform: ${config.storePlatform}`);
});
