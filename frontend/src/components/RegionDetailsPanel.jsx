import { useState, useEffect, useCallback } from 'react';
import { regionAPI, incidentAPI } from '../utils/api';

export default function RegionDetailsPanel({ regionId, onClose }) {
  const [region, setRegion] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewMode, setViewMode] = useState('region'); // 'region' or 'incident'
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' or 'discussion'
  const [newComment, setNewComment] = useState('');
  const [newIncidentComment, setNewIncidentComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadRegion = useCallback(async () => {
    try {
      setLoading(true);
      const [regionData, incidentsData] = await Promise.all([
        regionAPI.getById(regionId),
        regionAPI.getIncidents(regionId)
      ]);
      setRegion(regionData);
      setIncidents(incidentsData.incidents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    loadRegion();
  }, [loadRegion]);

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    if (score >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleAddRegionComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const updatedRegion = await regionAPI.addComment(regionId, newComment);
      setRegion(updatedRegion);
      setNewComment('');
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddIncidentComment = async (e, incidentId) => {
    e.preventDefault();
    if (!newIncidentComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await incidentAPI.addComment(incidentId, newIncidentComment);
      setNewIncidentComment('');
      // Reload incidents to show new comment
      const incidentsData = await regionAPI.getIncidents(regionId);
      setIncidents(incidentsData.incidents || []);
      // Update selected incident if in incident view mode
      if (viewMode === 'incident') {
        const updatedIncident = incidentsData.incidents.find(inc => inc.id === selectedIncident);
        if (updatedIncident) {
          setSelectedIncident(updatedIncident.id);
        }
      }
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleViewIncidentDetails = (incident) => {
    setSelectedIncident(incident.id);
    setViewMode('incident');
  };

  const handleBackToRegion = () => {
    setViewMode('region');
    setSelectedIncident(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading region...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {viewMode === 'incident' ? (
        /* Full-width Incident Details View */
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={handleBackToRegion}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">Incident Details</h2>
                  <p className="text-sm text-gray-500 mt-1">From {region.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Incident Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {(() => {
              const incident = incidents.find(inc => inc.id === selectedIncident);
              if (!incident) return <div>Incident not found</div>;
              
              return (
                <div className="space-y-4">
                  {/* Incident Type & Severity */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-900">
                      {incident.incident_type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-sm text-gray-900">{incident.description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className="inline-block px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                        {incident.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Area Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{incident.area_type}</p>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Reported By</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {incident.user_email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{incident.user_email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(incident.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Photos */}
                  {incident.images && incident.images.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Evidence Photos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {incident.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={`http://localhost:8000${img}`}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discussion Section */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Discussion ({incident.comments?.length || 0})
                    </h3>
                    
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {incident.comments && incident.comments.length > 0 ? (
                        incident.comments.map((comment) => (
                          <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-blue-600">
                                    {comment.user_email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{comment.user_email.split('@')[0]}</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic text-center py-4">No comments yet. Be the first to comment!</p>
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddIncidentComment(e, incident.id)} className="flex gap-2">
                      <input
                        type="text"
                        value={newIncidentComment}
                        onChange={(e) => setNewIncidentComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newIncidentComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        /* Region View */
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{region.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {region.incident_count} {region.incident_count === 1 ? 'incident' : 'incidents'} reported
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Safety Score - Compact */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Safety Score</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${getSafetyScoreColor(region.safety_score)}`}>
                    {region.safety_score.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-xs">/ 10</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'incidents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Incidents ({incidents.length})
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'discussion'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Discussion ({region.comments?.length || 0})
              </button>
            </div>

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  All Incidents ({incidents.length})
                </h3>
                <div className="space-y-3">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No incidents reported in this region yet.</p>
                    </div>
                  ) : (
                    incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all p-4 cursor-pointer"
                        onClick={() => handleViewIncidentDetails(incident)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {incident.incident_type.replace('_', ' ')}
                            </span>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(incident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {incident.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === 'discussion' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  Region Discussion
                </h3>

                {/* Add Comment Form */}
                <form onSubmit={handleAddRegionComment} className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this region..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {region.comments && region.comments.length > 0 ? (
                    region.comments.map((comment) => (
                      <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {comment.user_email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{comment.user_email.split('@')[0]}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm text-gray-500">No discussion yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
