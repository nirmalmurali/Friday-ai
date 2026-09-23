import { Router } from 'express';
import { dbRepository } from '../db/repository.js';
import { config } from '../config.js';

const router = Router();

// List approvals with optional status query
router.get('/', (req, res) => {
  try {
    const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
    const approvals = dbRepository.getApprovals(status);
    res.json(approvals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single approval by ID
router.get('/:id', (req, res) => {
  try {
    const item = dbRepository.getApprovalById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Approval item not found' });
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve approval (Approve or Reject)
router.post('/:id/resolve', async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const existing = dbRepository.getApprovalById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Approval item not found' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: `Approval item is already ${existing.status}` });
    }

    // Process approval execution if APPROVED
    let executionResult: any = null;
    if (status === 'APPROVED') {
      const payload = JSON.parse(existing.payload);
      if (existing.action_type === 'CREATE_STORE_DRAFT') {
        executionResult = {
          success: true,
          platform: config.storePlatform,
          external_draft_id: `DFT-${Math.floor(100000 + Math.random() * 900000)}`,
          message: `Successfully provisioned draft in ${config.storePlatform} store!`,
          product_title: payload.product_title,
          price: payload.price,
        };
      } else if (existing.action_type === 'PUBLISH_LISTING') {
        executionResult = {
          success: true,
          platform: config.storePlatform,
          published_url: `https://mock-mystore.com/products/${payload.slug || 'product'}`,
          message: 'Product listing published live to store catalog.',
        };
      } else if (existing.action_type === 'CREATE_AD_CAMPAIGN') {
        executionResult = {
          success: true,
          campaign_id: `CMP-${Date.now()}`,
          message: 'Ad campaign provisioned in Meta/TikTok sandbox.',
        };
      }
    }

    const updated = dbRepository.resolveApproval(req.params.id, status, reason);
    res.json({
      approval: updated,
      execution: executionResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
