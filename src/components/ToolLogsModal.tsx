import React, { useState, useEffect } from 'react';
import { X, Terminal, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { ToolLog } from '../types';
import { api } from '../services/api';

interface ToolLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolLogsModal: React.FC<ToolLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ToolLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getToolLogs(50);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load tool logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="modal-title">Tool Execution Audit Logs</h3>
              <p className="modal-subtitle">
                Complete traceability & execution monitoring for all agent tool calls
              </p>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="icon-btn"
              onClick={loadLogs}
              disabled={isLoading}
              title="Refresh Logs"
            >
              <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close Modal">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {logs.length === 0 ? (
            <div className="empty-logs">
              <Terminal size={32} className="empty-icon" />
              <p>No tool executions logged yet.</p>
            </div>
          ) : (
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Tool Name</th>
                    <th>Execution Time</th>
                    <th>Logged At</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={`log-row ${isExpanded ? 'log-row-expanded' : ''}`}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <td>
                            {log.status === 'SUCCESS' ? (
                              <span className="log-badge log-badge-success">
                                <CheckCircle size={12} /> SUCCESS
                              </span>
                            ) : (
                              <span className="log-badge log-badge-failed">
                                <XCircle size={12} /> FAILED
                              </span>
                            )}
                          </td>
                          <td className="log-tool-name">
                            <code>{log.tool_name}</code>
                          </td>
                          <td className="log-duration">{log.execution_time_ms}ms</td>
                          <td className="log-time">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td>
                            <button className="btn-table-action">
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="log-details-row">
                            <td colSpan={5}>
                              <div className="log-details-box">
                                <div className="detail-col">
                                  <strong>Input Arguments:</strong>
                                  <pre>{JSON.stringify(JSON.parse(log.arguments), null, 2)}</pre>
                                </div>
                                <div className="detail-col">
                                  <strong>Output Result:</strong>
                                  <pre>{JSON.stringify(JSON.parse(log.result), null, 2)}</pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
