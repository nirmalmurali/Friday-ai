import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/Chat/ChatWindow';
import { ApprovalSidebar } from './components/ApprovalQueue/ApprovalSidebar';
import { ToolLogsModal } from './components/ToolLogsModal';
import { api } from './services/api';
import type { Approval, Conversation, Message, SystemStatus } from './types';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApprovalSidebarOpen, setIsApprovalSidebarOpen] = useState(true);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Load
  const loadInitialData = useCallback(async () => {
    try {
      const [statusData, convosData, approvalsData] = await Promise.all([
        api.getSystemStatus(),
        api.getConversations(),
        api.getApprovals(),
      ]);

      setSystemStatus(statusData);
      setConversations(convosData);
      setApprovals(approvalsData);

      if (convosData.length > 0) {
        const firstConvoId = convosData[0].id;
        setActiveConversationId(firstConvoId);
        const msgs = await api.getMessages(firstConvoId);
        setMessages(msgs);
      } else {
        const newConvo = await api.createConversation('Dropshipping Strategy & Sourcing');
        setConversations([newConvo]);
        setActiveConversationId(newConvo.id);
        const msgs = await api.getMessages(newConvo.id);
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh Approvals
  const refreshApprovals = async () => {
    try {
      const list = await api.getApprovals();
      setApprovals(list);
      const statusData = await api.getSystemStatus();
      setSystemStatus(statusData);
    } catch (err) {
      console.error('Failed to refresh approvals:', err);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || isLoading) return;

    // Optimistic user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(activeConversationId, text);
      // Replace optimistic message and append real assistant message
      const latestMsgs = await api.getMessages(activeConversationId);
      setMessages(latestMsgs);

      // Check if any tool queued an approval
      if (response.toolCallsExecuted && response.toolCallsExecuted.length > 0) {
        await refreshApprovals();
        const hasQueuedAction = response.toolCallsExecuted.some(
          (tc) => tc.name === 'create_draft_listing' || tc.result?.status === 'QUEUED_FOR_APPROVAL'
        );
        if (hasQueuedAction) {
          setIsApprovalSidebarOpen(true);
          showToast('Draft action queued in the Approval Queue sidebar!', 'info');
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      showToast(err.message || 'Error executing agent request', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve Approval Handler
  const handleResolveApproval = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) => {
    try {
      const result = await api.resolveApproval(id, status, reason);
      await refreshApprovals();

      if (status === 'APPROVED') {
        showToast(
          result.execution?.message || 'Action approved and dispatched to store engine!',
          'success'
        );
      } else {
        showToast('Action rejected and archived.', 'info');
      }
    } catch (err: any) {
      console.error('Failed to resolve approval:', err);
      showToast(err.message || 'Failed to update approval', 'info');
    }
  };

  // New Chat Session
  const handleNewSession = async () => {
    try {
      const newConvo = await api.createConversation(`Session #${conversations.length + 1}`);
      setConversations((prev) => [newConvo, ...prev]);
      setActiveConversationId(newConvo.id);
      setMessages([]);
      showToast('Created new chat session', 'info');
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="app-layout" id="app-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-banner toast-${toastMessage.type}`} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        systemStatus={systemStatus}
        pendingApprovalsCount={pendingCount}
        isApprovalSidebarOpen={isApprovalSidebarOpen}
        onToggleApprovalSidebar={() => setIsApprovalSidebarOpen(!isApprovalSidebarOpen)}
        onOpenLogsModal={() => setIsLogsModalOpen(true)}
        onNewSession={handleNewSession}
      />

      {/* Main Content Workspace */}
      <main className="workspace-container">
        {/* Central Chat Interface */}
        <section className="chat-section">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </section>

        {/* Approval Queue Sidebar */}
        <ApprovalSidebar
          approvals={approvals}
          isOpen={isApprovalSidebarOpen}
          onClose={() => setIsApprovalSidebarOpen(false)}
          onRefresh={refreshApprovals}
          onResolve={handleResolveApproval}
        />
      </main>

      {/* Tool Execution Logs Audit Modal */}
      <ToolLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}

export default App;
