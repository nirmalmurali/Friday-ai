import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface ToolCallCardProps {
  name: string;
  args: any;
  result: any;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ name, args, result }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolFriendlyName = (n: string) => {
    switch (n) {
      case 'find_trending_products':
        return '🔍 Google Trends & Viral Signal Scan';
      case 'lookup_supplier_product':
        return '📦 Supplier Catalog Lookup';
      case 'calculate_margin':
        return '💰 Unit Economics & Margin Calculator';
      case 'create_draft_listing':
        return '🛡️ Store Draft Listing Creation (Queued)';
      case 'generate_seo_metadata':
        return '🚀 SEO Metadata & JSON-LD Generator';
      case 'generate_ad_copy':
        return '📢 Multi-Angle Ad Copy & Compliance Audit';
      case 'get_store_performance':
        return '📊 Store Analytics & Inventory Query';
      default:
        return `Tool: ${n}`;
    }
  };

  return (
    <div className="tool-call-card">
      <div
        className="tool-call-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="tool-call-title">
          <Wrench size={13} className="tool-icon" />
          <span className="tool-name">{getToolFriendlyName(name)}</span>
          <span className="tool-status-badge">
            <CheckCircle size={11} /> Executed
          </span>
        </div>

        <button className="tool-toggle-btn" aria-label="Toggle Tool Details">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="tool-call-body">
          <div className="tool-section">
            <div className="tool-section-label">Input Arguments:</div>
            <pre className="code-snippet">{JSON.stringify(args, null, 2)}</pre>
          </div>

          <div className="tool-section">
            <div className="tool-section-label">Tool Result Data:</div>
            <pre className="code-snippet">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
