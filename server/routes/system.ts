import { Router } from 'express';
import { config } from '../config.js';
import { dbRepository } from '../db/repository.js';
import { executeTool } from '../agent/toolExecutor.js';

const router = Router();

// System configuration and live status
router.get('/status', (req, res) => {
  try {
    const pendingApprovals = dbRepository.getApprovals('PENDING');
    const recentLogs = dbRepository.getToolLogs(5);

    res.json({
      status: 'operational',
      environment: config.nodeEnv,
      storePlatform: config.storePlatform,
      defaultNiche: config.defaultNiche,
      defaultCountry: config.defaultCountry,
      defaultCurrency: config.defaultCurrency,
      llm: {
        model: config.anthropicModel,
        hasApiKey: Boolean(config.anthropicApiKey && config.anthropicApiKey.trim() !== ''),
        mode: config.anthropicApiKey && config.anthropicApiKey.trim() !== '' ? 'LIVE_CLAUDE' : 'SANDBOX_SIMULATOR',
      },
      stats: {
        pendingApprovalsCount: pendingApprovals.length,
        recentToolCallsCount: recentLogs.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tool logs endpoint
router.get('/tool-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const logs = dbRepository.getToolLogs(limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Direct tool execution endpoint (e.g. for interactive margin calculator in UI)
router.post('/tools/execute', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }
    const result = await executeTool(toolName, args || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
