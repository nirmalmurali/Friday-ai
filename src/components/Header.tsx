import React from 'react';
import { Bot, ShieldCheck, Sparkles, CheckSquare, Terminal, PlusCircle } from 'lucide-react';
import type { SystemStatus } from '../types';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  pendingApprovalsCount: number;
  isApprovalSidebarOpen: boolean;
  onToggleApprovalSidebar: () => void;
  onOpenLogsModal: () => void;
  onNewSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  pendingApprovalsCount,
  isApprovalSidebarOpen,
  onToggleApprovalSidebar,
  onOpenLogsModal,
  onNewSession,
}) => {
  const isLive = systemStatus?.llm.mode === 'LIVE_CLAUDE';

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <div className="brand-badge">
          <div className="bot-avatar-glow">
            <Bot size={22} className="bot-icon" />
          </div>
          <div>
            <div className="brand-title">
              FRIDAY <span className="brand-highlight">AI</span>
            </div>
            <div className="brand-subtitle">Dropshipping Business Operator</div>
          </div>
        </div>

        <div className="context-pills">
          <div className="pill pill-store">
            <span className="pill-dot dot-cyan"></span>
            <span>Store: <strong>{systemStatus?.storePlatform.toUpperCase() || 'MOCK'}</strong></span>
          </div>

          <div className="pill pill-market">
            <span className="pill-dot dot-violet"></span>
            <span>Market: <strong>{systemStatus?.defaultCountry || 'Australia'} ({systemStatus?.defaultCurrency || 'AUD'})</strong></span>
          </div>

          <div className={`pill ${isLive ? 'pill-live' : 'pill-sandbox'}`}>
            <Sparkles size={12} />
            <span>
              {isLive ? `Claude (${systemStatus?.llm.model})` : 'Sandbox Simulator'}
            </span>
          </div>

          <div className="pill pill-safety" title="Safety Gate prevents unapproved publishing or ad spend">
            <ShieldCheck size={14} className="safety-icon" />
            <span>Safety Gate: <strong>ACTIVE</strong></span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          id="btn-new-chat"
          className="btn btn-secondary"
          onClick={onNewSession}
          title="Start fresh dropshipping strategy session"
        >
          <PlusCircle size={15} />
          <span>New Chat</span>
        </button>

        <button
          id="btn-view-audit-logs"
          className="btn btn-secondary"
          onClick={onOpenLogsModal}
          title="View tool execution audit logs"
        >
          <Terminal size={15} />
          <span>Audit Logs</span>
        </button>

        <button
          id="btn-toggle-approval-queue"
          className={`btn ${pendingApprovalsCount > 0 ? 'btn-warning-glow' : 'btn-primary'} ${
            isApprovalSidebarOpen ? 'btn-active' : ''
          }`}
          onClick={onToggleApprovalSidebar}
          title="Toggle Approval Queue Sidebar"
        >
          <CheckSquare size={16} />
          <span>Approval Queue</span>
          {pendingApprovalsCount > 0 && (
            <span className="badge-count" id="header-pending-count">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
