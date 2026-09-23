import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  RefreshCw,
  X,
  Inbox,
} from 'lucide-react';
import type { Approval } from '../../types';
import { ApprovalCard } from './ApprovalCard';

interface ApprovalSidebarProps {
  approvals: Approval[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onResolve: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const ApprovalSidebar: React.FC<ApprovalSidebarProps> = ({
  approvals,
  isOpen,
  onClose,
  onRefresh,
  onResolve,
}) => {
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const approvedApprovals = approvals.filter((a) => a.status === 'APPROVED');

  const displayedApprovals = approvals.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'APPROVED') return a.status === 'APPROVED';
    return true;
  });

  return (
    <aside
      className={`approval-sidebar-drawer ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      id="approval-sidebar"
    >
      <div className="sidebar-header">
        <div className="sidebar-title-group">
          <div className="sidebar-icon-box">
            <CheckSquare size={18} className="sidebar-icon" />
          </div>
          <div>
            <h3 className="sidebar-title">Approval Queue</h3>
            <p className="sidebar-subtitle">Human Safety Authorization Gate</p>
          </div>
        </div>

        <div className="sidebar-header-actions">
          <button
            className="icon-btn"
            onClick={onRefresh}
            title="Refresh Approvals"
            aria-label="Refresh Approvals"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="icon-btn"
            onClick={onClose}
            title="Close Sidebar"
            aria-label="Close Sidebar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="safety-policy-notice">
        <ShieldCheck size={16} className="notice-icon" />
        <p>
          <strong>Safety Rule #1:</strong> Friday never alters your live store or spends ad budget without your manual approval here.
        </p>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${filter === 'PENDING' ? 'tab-active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Pending
          <span className="tab-pill tab-pill-amber">{pendingApprovals.length}</span>
        </button>

        <button
          className={`tab-btn ${filter === 'APPROVED' ? 'tab-active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          Approved
          <span className="tab-pill tab-pill-emerald">{approvedApprovals.length}</span>
        </button>

        <button
          className={`tab-btn ${filter === 'ALL' ? 'tab-active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All
          <span className="tab-pill">{approvals.length}</span>
        </button>
      </div>

      {/* List */}
      <div className="sidebar-content-scroll">
        {displayedApprovals.length === 0 ? (
          <div className="empty-queue-state">
            <div className="empty-icon-circle">
              <Inbox size={28} className="empty-icon" />
            </div>
            <h4>No {filter.toLowerCase()} approvals</h4>
            <p>
              {filter === 'PENDING'
                ? "You're all caught up! When Friday creates drafts or ad campaigns, they will appear here for your review."
                : 'No historical approvals in this category.'}
            </p>
          </div>
        ) : (
          <div className="approval-items-list">
            {displayedApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onResolve={onResolve}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
