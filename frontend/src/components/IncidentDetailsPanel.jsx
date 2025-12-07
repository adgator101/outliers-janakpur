import { useState, useEffect } from "react";
import { incidentAPI } from "../utils/api";

export default function IncidentDetailsPanel({
  incidentId,
  onClose,
  onUpdate,
}) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await incidentAPI.getById(incidentId);
      setIncident(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const updated = await incidentAPI.addComment(incidentId, commentText);
      setIncident(updated);
      setCommentText("");
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: "bg-green-50 text-green-700 border-green-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      critical: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[severity] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-gray-50 text-gray-700 border-gray-200",
      verified: "bg-blue-50 text-blue-700 border-blue-200",
      resolved: "bg-green-50 text-green-700 border-green-200",
      invalid: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-sm text-gray-500">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-3">⚠️</div>
            <p className="text-red-600 font-medium">
              {error || "Incident not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Incident Details
            </h2>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
                  incident.severity
                )}`}
              >
                {incident.severity}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  incident.status
                )}`}
              >
                {incident.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Type
            </h3>
            <p className="text-base font-medium text-gray-900 capitalize">
              {incident.incident_type.replace("_", " ")}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-900 leading-relaxed">
              {incident.description}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Reported
            </h3>
            <p className="text-sm text-gray-900">
              {new Date(incident.created_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          {incident.alert_level !== "normal" && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">
                    Alert Level
                  </h3>
                  <p className="mt-1 text-sm text-red-700 capitalize font-medium">
                    {incident.alert_level.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Images Section */}
          {incident.images && incident.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Photos
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-4 snap-x">
                {incident.images.map((imgUrl, index) => {
                  // Construct full URL if it's relative
                  const fullUrl = imgUrl.startsWith('http') 
                    ? imgUrl 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${imgUrl}`;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex-shrink-0 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm snap-start"
                    >
                      <img
                        src={fullUrl}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                        onClick={() => window.open(fullUrl, '_blank')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-2 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            Discussion
            <span className="text-sm font-normal text-gray-500">
              ({incident.comments?.length || 0})
            </span>
          </h3>

          {/* Comments List */}
          <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
            {incident.comments && incident.comments.length > 0 ? (
              incident.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {comment.user_email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm text-gray-500 italic">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Form Footer */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900 bg-white shadow-sm"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentText.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-all"
          >
            {submittingComment ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Posting...
              </span>
            ) : (
              "Post Comment"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
