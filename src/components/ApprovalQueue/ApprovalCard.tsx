import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Store,
  Megaphone,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import type { Approval } from '../../types';

interface ApprovalCardProps {
  approval: Approval;
  onResolve: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, onResolve }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  let payloadData: any = {};
  try {
    payloadData = JSON.parse(approval.payload);
  } catch (e) {
    payloadData = { raw: approval.payload };
  }

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true);
    try {
      await onResolve(approval.id, status, status === 'REJECTED' ? rejectionReason : undefined);
    } finally {
      setIsProcessing(false);
      setShowRejectInput(false);
    }
  };

  const getActionIcon = () => {
    switch (approval.action_type) {
      case 'CREATE_STORE_DRAFT':
        return <Store size={15} className="action-icon icon-cyan" />;
      case 'PUBLISH_LISTING':
        return <UploadCloud size={15} className="action-icon icon-emerald" />;
      case 'CREATE_AD_CAMPAIGN':
        return <Megaphone size={15} className="action-icon icon-purple" />;
      default:
        return <ShieldAlert size={15} className="action-icon icon-amber" />;
    }
  };

  const getStatusBadge = () => {
    switch (approval.status) {
      case 'PENDING':
        return (
          <span className="status-badge badge-pending">
            <span className="pulsing-amber-dot"></span>
            Awaiting Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="status-badge badge-approved">
            <CheckCircle size={12} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-badge badge-rejected">
            <XCircle size={12} /> Rejected
          </span>
        );
    }
  };

  return (
    <div className={`approval-card approval-${approval.status.toLowerCase()}`}>
      <div className="approval-card-header">
        <div className="approval-type-row">
          <div className="action-type-tag">
            {getActionIcon()}
            <span>{approval.action_type.replace(/_/g, ' ')}</span>
          </div>
          {getStatusBadge()}
        </div>

        <h4 className="approval-title">{approval.title}</h4>
        <div className="approval-description">{approval.description}</div>

        <div className="approval-meta-row">
          <span className="approval-time">
            <Clock size={11} /> {new Date(approval.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>

          <button
            className="btn-details-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle details"
          >
            <span>{isExpanded ? 'Hide Payload' : 'Inspect Payload'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="approval-card-details">
          {payloadData.product_title && (
            <div className="detail-field">
              <span className="field-label">Product Title:</span>
              <span className="field-value font-medium">{payloadData.product_title}</span>
            </div>
          )}

          {payloadData.price && (
            <div className="detail-field">
              <span className="field-label">Target Retail Price:</span>
              <span className="field-value font-bold text-emerald">
                ${payloadData.price} AUD
              </span>
            </div>
          )}

          {payloadData.niche && (
            <div className="detail-field">
              <span className="field-label">Niche Category:</span>
              <span className="field-value">{payloadData.niche}</span>
            </div>
          )}

          {payloadData.images && payloadData.images.length > 0 && (
            <div className="detail-field detail-images">
              <span className="field-label">Staged Product Images:</span>
              <div className="preview-image-list">
                {payloadData.images.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preview ${i}`}
                    className="preview-img-thumb"
                  />
                ))}
              </div>
            </div>
          )}

          {payloadData.supplier_url && (
            <div className="detail-field">
              <span className="field-label">Supplier Source:</span>
              <a
                href={payloadData.supplier_url}
                target="_blank"
                rel="noreferrer"
                className="supplier-link"
              >
                <span>View Supplier Listing</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          <div className="detail-field">
            <span className="field-label">Raw JSON:</span>
            <pre className="raw-payload-pre">{JSON.stringify(payloadData, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Action Buttons (Only for PENDING items) */}
      {approval.status === 'PENDING' && (
        <div className="approval-card-footer">
          {showRejectInput ? (
            <div className="reject-input-group">
              <input
                type="text"
                className="reject-reason-input"
                placeholder="Optional rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="reject-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleAction('REJECTED')}
                  disabled={isProcessing}
                >
                  Confirm Reject
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRejectInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="action-buttons-group">
              <button
                id={`btn-reject-${approval.id}`}
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowRejectInput(true)}
                disabled={isProcessing}
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>

              <button
                id={`btn-approve-${approval.id}`}
                className="btn btn-success btn-sm"
                onClick={() => handleAction('APPROVED')}
                disabled={isProcessing}
              >
                <CheckCircle size={14} />
                <span>{isProcessing ? 'Deploying...' : 'Approve Action'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
