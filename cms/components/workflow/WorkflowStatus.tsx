'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  PencilIcon,
  CalendarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { WorkflowService } from '@/lib/workflow';

interface WorkflowStatusProps {
  contentType: 'product' | 'page';
  contentId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function WorkflowStatus({
  contentType,
  contentId,
  currentStatus,
  onStatusChange
}: WorkflowStatusProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const userRole = session?.user?.role || 'VIEWER';

  // Get available transitions for current user
  const availableTransitions = WorkflowService.getAvailableTransitions(
    currentStatus as any,
    userRole as any
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <PencilIcon className=\"h-4 w-4 text-gray-500\" />;
      case 'REVIEW':
        return <ClockIcon className=\"h-4 w-4 text-yellow-500\" />;
      case 'PUBLISHED':
        return <CheckCircleIcon className=\"h-4 w-4 text-green-500\" />;
      case 'ARCHIVED':
        return <ArchiveBoxIcon className=\"h-4 w-4 text-gray-400\" />;
      default:
        return <PencilIcon className=\"h-4 w-4 text-gray-500\" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (toStatus: string) => {
    switch (toStatus) {
      case 'REVIEW':
        return 'Submit for Review';
      case 'PUBLISHED':
        return 'Publish';
      case 'DRAFT':
        return 'Move to Draft';
      case 'ARCHIVED':
        return 'Archive';
      default:
        return `Move to ${toStatus}`;
    }
  };

  const getActionIcon = (toStatus: string) => {
    switch (toStatus) {
      case 'REVIEW':
        return <ClockIcon className=\"h-4 w-4\" />;
      case 'PUBLISHED':
        return <CheckCircleIcon className=\"h-4 w-4\" />;
      case 'DRAFT':
        return <PencilIcon className=\"h-4 w-4\" />;
      case 'ARCHIVED':
        return <ArchiveBoxIcon className=\"h-4 w-4\" />;
      default:
        return <PencilIcon className=\"h-4 w-4\" />;
    }
  };

  const handleWorkflowAction = async (toStatus: string, actionType: string) => {
    // Check if action requires approval or comment
    const transition = availableTransitions.find(t => t.to === toStatus);
    if (transition?.requiresApproval || ['reject', 'archive'].includes(actionType)) {
      setPendingAction(actionType);
      setShowCommentModal(true);
      return;
    }

    await executeAction(actionType);
  };

  const executeAction = async (actionType: string) => {
    try {
      setIsLoading(true);

      const requestData: any = {
        contentType,
        contentId,
        action: actionType
      };

      if (comment.trim()) {
        requestData.comment = comment.trim();
      }

      if (scheduledDate && actionType === 'schedule') {
        requestData.scheduledFor = new Date(scheduledDate).toISOString();
      }

      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        // Determine new status based on action
        let newStatus = currentStatus;
        switch (actionType) {
          case 'submit_for_review':
            newStatus = 'REVIEW';
            break;
          case 'approve':
          case 'publish':
            newStatus = 'PUBLISHED';
            break;
          case 'reject':
            newStatus = 'DRAFT';
            break;
          case 'archive':
            newStatus = 'ARCHIVED';
            break;
        }

        if (onStatusChange) {
          onStatusChange(newStatus);
        }

        // Reset form
        setComment('');
        setScheduledDate('');
        setShowCommentModal(false);
        setPendingAction(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Workflow action error:', error);
      alert('An error occurred while processing the workflow action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  return (
    <div className=\"bg-white border border-gray-200 rounded-lg p-4\">
      {/* Current Status */}
      <div className=\"flex items-center justify-between mb-4\">
        <div className=\"flex items-center\">
          <h3 className=\"text-sm font-medium text-gray-900 mr-3\">Status</h3>
          <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(currentStatus)}`}>
            {getStatusIcon(currentStatus)}
            <span className=\"ml-2 text-sm font-medium\">{currentStatus}</span>
          </div>
        </div>
      </div>

      {/* Available Actions */}
      {availableTransitions.length > 0 && (
        <div className=\"space-y-3\">
          <h4 className=\"text-sm font-medium text-gray-700\">Available Actions</h4>
          <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-2\">
            {availableTransitions.map((transition) => {
              const actionType = getActionType(currentStatus, transition.to);
              return (
                <button
                  key={transition.to}
                  onClick={() => handleWorkflowAction(transition.to, actionType)}
                  disabled={isLoading}
                  className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    transition.to === 'PUBLISHED'
                      ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                      : transition.to === 'ARCHIVED'
                      ? 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
                      : transition.to === 'REVIEW'
                      ? 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getActionIcon(transition.to)}
                  <span className=\"ml-2\">{getActionLabel(transition.to)}</span>
                </button>
              );
            })}
          </div>

          {/* Schedule Publishing Option */}
          {currentStatus === 'DRAFT' && userRole === 'ADMIN' && (
            <div className=\"pt-3 border-t border-gray-200\">
              <button
                onClick={() => {
                  setPendingAction('schedule');
                  setShowCommentModal(true);
                }}
                disabled={isLoading}
                className=\"flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed\"
              >
                <CalendarIcon className=\"h-4 w-4 mr-2\" />
                Schedule for Later
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-md mx-4\">
            <div className=\"flex items-center mb-4\">
              <ChatBubbleLeftIcon className=\"h-5 w-5 text-gray-400 mr-2\" />
              <h3 className=\"text-lg font-medium text-gray-900\">
                {pendingAction === 'schedule' ? 'Schedule Publication' : 'Add Comment'}
              </h3>
            </div>

            {pendingAction === 'schedule' && (
              <div className=\"mb-4\">
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Publish Date & Time
                </label>
                <input
                  type=\"datetime-local\"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                  required
                />
              </div>
            )}

            <div className=\"mb-4\">
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                {pendingAction === 'reject' ? 'Rejection Reason' : 'Comment (Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                placeholder={
                  pendingAction === 'reject'
                    ? 'Please provide a reason for rejection...'
                    : 'Add any additional notes...'
                }
              />
            </div>

            <div className=\"flex justify-end space-x-3\">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setPendingAction(null);
                  setComment('');
                  setScheduledDate('');
                }}
                className=\"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={isLoading || (pendingAction === 'schedule' && !scheduledDate)}
                className=\"px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine action type based on status transition
function getActionType(fromStatus: string, toStatus: string): string {
  if (fromStatus === 'DRAFT' && toStatus === 'REVIEW') return 'submit_for_review';
  if (fromStatus === 'REVIEW' && toStatus === 'PUBLISHED') return 'approve';
  if (fromStatus === 'REVIEW' && toStatus === 'DRAFT') return 'reject';
  if (toStatus === 'PUBLISHED') return 'publish';
  if (toStatus === 'ARCHIVED') return 'archive';
  return 'update_status';
}