import { useState } from 'react';
import { toast } from 'sonner';

import { getApiBaseUrl } from '../config.js';

export default function ReportModal({ onClose, artworkId }) {
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportError, setReportError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportReason) {
      setReportError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, we'll use a similar endpoint structure
      // You may need to create /artworks/:id/report endpoint on backend
      const response = await fetch(`${getApiBaseUrl()}/artworks/${artworkId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });

      if (response.ok) {
        toast.success('Report submitted successfully');
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setReportError(errorData.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Report error:', error);
      setReportError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Report Artwork</h2>

        {/* Reason options */}
        <div className="space-y-2 mb-4">
          {[
            'Spam',
            'Harassment',
            'Inappropriate content',
            'Copyright violation',
            'Other',
          ].map((reason) => (
            <label key={reason} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={reportReason === reason}
                onChange={(e) => {
                  setReportReason(e.target.value);
                  setReportError('');
                }}
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>

        {/* Additional details (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional details (optional)
          </label>
          <textarea
            rows={3}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {reportError && (
          <p className="mb-3 text-xs text-red-500">{reportError}</p>
        )}

        {/* Modal buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

