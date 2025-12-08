import { useState, useEffect } from "react";
import { incidentAPI, authAPI } from "../utils/api";
import AuditForm from "./AuditForm";

export default function IncidentDetailsPanel({
  incidents = [], // Array of incident objects
  onClose,
  onUpdate,
}) {
  const [activeIncident, setActiveIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = authAPI.getUserRole();
    setUserRole(role);
  }, []);

  // Auto-select if only one incident
  useEffect(() => {
    if (incidents.length === 1) {
      setActiveIncident(incidents[0]);
    } else {
      setActiveIncident(null);
    }
  }, [incidents]);

  const handleIncidentClick = (incident) => {
    setActiveIncident(incident);
  };

  const handleBackToList = () => {
    setActiveIncident(null);
  };

  const refreshActiveIncident = async () => {
    if (!activeIncident) return;
    try {
      const updated = await incidentAPI.getById(activeIncident.id);
      setActiveIncident(updated);
      onUpdate && onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      if (activeIncident) {
        await incidentAPI.addComment(activeIncident.id, commentText);
        setCommentText("");
        await refreshActiveIncident();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitAudit = async (auditData) => {
    try {
      if (userRole === 'admin') {
        await incidentAPI.validateAdmin(activeIncident.id, auditData);
      } else if (userRole === 'ngo') {
        await incidentAPI.validateNGO(activeIncident.id, auditData);
      }
      setShowAuditForm(false);
      await refreshActiveIncident();
    } catch (err) {
      throw err; // Let AuditForm handle the error
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

  // ... (Recalculate or mock safety score based on incidents list)
  const calculateSafetyScore = () => {
    if (!incidents.length) return 10;
    // Simple logic: Start at 10. Subtract based on severity.
    let score = 10;
    incidents.forEach((inc) => {
      if (inc.severity === "critical") score -= 3;
      else if (inc.severity === "high") score -= 2;
      else if (inc.severity === "medium") score -= 1;
      else score -= 0.5;
    });
    return Math.max(0, score).toFixed(1);
  };
  const safetyScore = calculateSafetyScore();

  // LIST VIEW
  if (!activeIncident && incidents.length > 1) {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Area Overview</h2>
            <p className="text-sm text-gray-500">
              {incidents.length} Reports Found
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {/* Safety Score Card */}
        <div className="p-6 pb-2">
          <div
            className={`rounded-xl p-4 text-white shadow-lg ${
              safetyScore > 7
                ? "bg-green-500"
                : safetyScore > 4
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          >
            <p className="text-xs font-bold uppercase opacity-90">
              Safety Score
            </p>
            <div className="text-4xl font-bold mt-1">
              {safetyScore}
              <span className="text-lg opacity-75">/10</span>
            </div>
            <p className="text-sm mt-2 font-medium opacity-90">
              {safetyScore > 7
                ? "Relatively Safe"
                : safetyScore > 4
                ? "Exercise Caution"
                : "High Risk Area"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleIncidentClick(inc)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded capitalize ${getSeverityColor(
                    inc.severity
                  )}`}
                >
                  {inc.incident_type.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(inc.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-2">
                {inc.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DETAILED VIEW (Active Incident)
  if (activeIncident) {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {incidents.length > 1 && (
                <button
                  onClick={handleBackToList}
                  className="mb-2 flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  ← Back to List
                </button>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Incident Details
              </h2>
              {/* Labels... */}
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
                    activeIncident.severity
                  )}`}
                >
                  {activeIncident.severity}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-600">
                  {activeIncident.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-full p-2"
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

        {/* Content Body (Reuse existing) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {/* Type, Desc, Date Blocks... */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Type
              </h3>
              <p className="text-base font-medium text-gray-900 capitalize">
                {activeIncident.incident_type.replace("_", " ")}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </h3>
              <p className="text-sm text-gray-900 leading-relaxed">
                {activeIncident.description}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Reported
              </h3>
              <p className="text-sm text-gray-900">
                {new Date(activeIncident.created_at).toLocaleString()}
              </p>
            </div>

            {/* Images Section */}
            {activeIncident.images && activeIncident.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Photos
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-4 snap-x">
                  {activeIncident.images.map((imgUrl, index) => {
                    const fullUrl = imgUrl.startsWith("http")
                      ? imgUrl
                      : `${
                          import.meta.env.VITE_API_URL?.replace("/api", "") ||
                          "http://localhost:8000"
                        }${imgUrl}`;
                    return (
                      <div
                        key={index}
                        className="flex-shrink-0 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 snap-start"
                      >
                        <img
                          src={fullUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                          onClick={() => window.open(fullUrl, "_blank")}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weight & Audit Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Risk Assessment
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Initial Weight</p>
                  <p className="text-lg font-bold text-gray-900">
                    {activeIncident.initial_weight?.toFixed(2) || '1.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Time Decay</p>
                  <p className="text-lg font-bold text-gray-900">
                    {activeIncident.time_decay_factor?.toFixed(2) || '1.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Audit Multiplier</p>
                  <p className="text-lg font-bold text-gray-900">
                    {activeIncident.effective_multiplier?.toFixed(2) || '1.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Contribution</p>
                  <p className="text-lg font-bold text-blue-600">
                    {activeIncident.contribution_score?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              
              {/* Audits List */}
              {activeIncident.audits && activeIncident.audits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Audits ({activeIncident.audits.length})
                  </p>
                  <div className="space-y-2">
                    {activeIncident.audits.map((audit, idx) => (
                      <div key={idx} className="bg-white rounded p-2 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900">
                            {audit.auditor_email}
                          </span>
                          <span className="text-gray-500">
                            {new Date(audit.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <div>S_env: <span className="font-semibold">{audit.s_env?.toFixed(2)}</span></div>
                          <div>Multiplier: <span className="font-semibold">{audit.multiplier?.toFixed(2)}</span></div>
                        </div>
                        {audit.notes && (
                          <p className="mt-1 text-gray-700">{audit.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Button for Admin/NGO */}
              {(userRole === 'admin' || userRole === 'ngo') && (
                <button
                  onClick={() => setShowAuditForm(true)}
                  className="w-full mt-3 px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Submit Audit
                </button>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Discussion ({activeIncident.comments?.length || 0})
              </h3>
              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
                {activeIncident.comments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold">
                        {comment.user_email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{comment.text}</p>
                  </div>
                ))}
                {!activeIncident.comments?.length && (
                  <div className="text-center py-4 text-gray-500 italic">
                    No comments
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none text-sm text-gray-900 placeholder-gray-400 bg-white"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="w-full bg-white text-blue-600 border-2 border-blue-600 py-3 px-4 rounded-lg font-bold hover:bg-blue-50 disabled:opacity-50"
            >
              {submittingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        </div>

        {/* Audit Form Modal */}
        {showAuditForm && (
          <AuditForm
            incident={activeIncident}
            onSubmit={handleSubmitAudit}
            onCancel={() => setShowAuditForm(false)}
            userRole={userRole}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
}
