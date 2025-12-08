import { useState } from 'react';
import { incidentAPI } from '../utils/api';

export default function IncidentReportForm({ coordinates, areaType, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    incidentType: 'unsafe_area',
    description: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...files]);
    setPreviews([...previews, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Upload images first
      const uploadedImageUrls = [];
      if (images.length > 0) {
        for (const imageFile of images) {
          const response = await incidentAPI.uploadImage(imageFile);
          if (response && response.url) {
            uploadedImageUrls.push(response.url);
          }
        }
      }

      const incidentData = {
        area_type: areaType,
        coordinates: coordinates,
        incident_type: formData.incidentType,
        description: formData.description,
        severity: 'medium',
        images: uploadedImageUrls
      };

      await incidentAPI.create(incidentData);
      previews.forEach(url => URL.revokeObjectURL(url));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Report Incident</h2>
            <p className="text-sm text-gray-500 mt-1">Help keep the community safe</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full p-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="gbv">Gender-Based Violence</option>
              <option value="unsafe_area">Unsafe Area</option>
              <option value="no_lights">No Street Lights</option>
              <option value="other">Other Safety Concern</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              placeholder="Describe the incident or safety concern..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-900"
            />
            <p className="mt-2 text-xs text-gray-500">
              Your report is anonymous. Be specific about time and circumstances.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={images.length >= 5}
              className="hidden"
              id="image-upload"
            />
            
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
                images.length >= 5
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">Max 5 images, up to 10MB each</p>
            </label>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {previews.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-white text-red-600 border-2 border-red-600 rounded-full p-1 shadow-md hover:bg-red-50 hover:shadow-lg transition-all transform hover:scale-110"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Area Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Area Information</h3>
            <p className="text-xs text-gray-600">Type: {areaType}</p>
            <p className="text-xs text-gray-600">Points: {coordinates?.coordinates?.length || 0}</p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-white text-emerald-600 border-2 border-emerald-600 py-2.5 px-4 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 font-medium transition-all shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
