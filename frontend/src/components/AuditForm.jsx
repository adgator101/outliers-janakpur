import { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * AuditForm Component
 * Allows admins/NGOs to submit environmental audits for incidents
 */
export default function AuditForm({ incident, onSubmit, onCancel, userRole }) {
  const [formData, setFormData] = useState({
    lighting: 0.5,
    visibility: 0.5,
    crowdActivity: 0.5,
    walkpath: 0.5,
    transportAccess: 0.5,
    cctvPolicePresence: 0.5,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Calculate weighted environmental score (S_env)
  const calculateSEnv = () => {
    const weights = {
      lighting: 0.25,
      visibility: 0.15,
      crowdActivity: 0.15,
      walkpath: 0.15,
      transportAccess: 0.15,
      cctvPolicePresence: 0.15
    };

    const sEnv = Object.keys(weights).reduce((sum, key) => {
      return sum + (formData[key] * weights[key]);
    }, 0);

    return Math.round(sEnv * 100) / 100; // Round to 2 decimals
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const sEnv = calculateSEnv();
      await onSubmit({
        s_env: sEnv,
        validation_notes: formData.notes || undefined
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const sEnv = calculateSEnv();
  const riskLevel = sEnv < 0.3 ? 'Low Risk' : sEnv < 0.6 ? 'Medium Risk' : 'High Risk';
  const riskColor = sEnv < 0.3 ? 'text-green-600' : sEnv < 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">Submit Audit</h2>
                <p className="text-sm text-gray-600">
                  {userRole === 'admin' ? 'Admin' : 'NGO'} Environmental Assessment
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Rate environmental parameters based on site conditions. 
              Lower values (0-0.3) indicate safer environments, higher values (0.7-1.0) indicate higher risk.
            </p>
          </div>

          {/* Environmental Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Environmental Parameters</h3>

            {/* Lighting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lighting Quality (0 = Excellent, 1 = Very Poor)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.lighting}
                onChange={(e) => handleSliderChange('lighting', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Excellent</span>
                <span className="font-medium">{formData.lighting.toFixed(1)}</span>
                <span>Very Poor</span>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility (0 = Clear, 1 = Obstructed)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.visibility}
                onChange={(e) => handleSliderChange('visibility', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Clear</span>
                <span className="font-medium">{formData.visibility.toFixed(1)}</span>
                <span>Obstructed</span>
              </div>
            </div>

            {/* Crowd/Activity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crowd/Activity (0 = High Activity, 1 = Isolated)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.crowdActivity}
                onChange={(e) => handleSliderChange('crowdActivity', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>High Activity</span>
                <span className="font-medium">{formData.crowdActivity.toFixed(1)}</span>
                <span>Isolated</span>
              </div>
            </div>

            {/* Walkpath Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Walkpath Quality (0 = Safe/Maintained, 1 = Unsafe/Poor)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.walkpath}
                onChange={(e) => handleSliderChange('walkpath', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Safe</span>
                <span className="font-medium">{formData.walkpath.toFixed(1)}</span>
                <span>Unsafe</span>
              </div>
            </div>

            {/* Transport Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transport Availability (0 = Easy Access, 1 = No Access)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.transportAccess}
                onChange={(e) => handleSliderChange('transportAccess', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Easy Access</span>
                <span className="font-medium">{formData.transportAccess.toFixed(1)}</span>
                <span>No Access</span>
              </div>
            </div>

            {/* CCTV/Police Presence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CCTV/Police Presence (0 = Strong, 1 = None)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.cctvPolicePresence}
                onChange={(e) => handleSliderChange('cctvPolicePresence', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Strong</span>
                <span className="font-medium">{formData.cctvPolicePresence.toFixed(1)}</span>
                <span>None</span>
              </div>
            </div>
          </div>

          {/* Calculated Environmental Score */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Environmental Score (S_env)</p>
                <p className="text-xs text-gray-500">Weighted average of all parameters</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{sEnv.toFixed(2)}</p>
                <p className={`text-sm font-medium ${riskColor}`}>{riskLevel}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional observations about the site conditions..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Do not include or reveal reporter identity in notes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Audit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
