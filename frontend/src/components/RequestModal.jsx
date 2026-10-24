import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Navigation, AlertCircle, Droplet, Building2, Layers, CheckCircle2 } from 'lucide-react';
import { createBloodRequest } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RequestModal = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();

  const [bloodGroupNeeded, setBloodGroupNeeded] = useState('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically attempt to fetch current geolocation when modal opens if coordinates are empty
  useEffect(() => {
    if (isOpen && !longitude && !latitude) {
      handleDetectLocation();
    }
  }, [isOpen]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }

    setIsDetectingLocation(true);
    setError('');
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // GeoJSON standard: [longitude, latitude]
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        setLongitude(lng);
        setLatitude(lat);
        setIsDetectingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn('Geolocation capture failed:', err);
        // Fallback to sample coordinates for Hyderabad healthcare hub if GPS permission denied
        setLongitude(78.4867);
        setLatitude(17.3850);
        setIsDetectingLocation(false);
        setError('GPS permission denied or unavailable. Default coordinates populated for Hyderabad; you can manually edit them or choose a city preset.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hospitalAddress.trim()) {
      setError('Please provide the hospital or medical facility name and address.');
      return;
    }

    const lngNum = parseFloat(longitude);
    const latNum = parseFloat(latitude);

    if (isNaN(lngNum) || isNaN(latNum)) {
      setError('Please provide valid numerical coordinates [longitude, latitude].');
      return;
    }

    // Latitude must be -90 to 90, Longitude must be -180 to 180
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError('Invalid geographic coordinates range.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Coordinates MUST be [longitude, latitude]
      const payload = {
        bloodGroupNeeded,
        unitsNeeded: Number(unitsNeeded) || 1,
        hospitalAddress: hospitalAddress.trim(),
        hospitalCoordinates: [lngNum, latNum]
      };

      const result = await createBloodRequest(payload);

      if (onCreated) {
        onCreated(result.request);
      }

      onClose();
      // Navigate directly to the Dual-Tab Search Results page for this emergency request
      navigate(`/requests/${result.request._id}/search`);
    } catch (err) {
      setError(err.message || 'Failed to broadcast emergency blood request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Droplet className="w-6 h-6 fill-white text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Request Blood Urgently</h2>
              <p className="text-xs text-red-100 mt-0.5">
                Two-tier matching: Public blood banks & WhatsApp donor alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Blood Group and Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Blood Group Needed <span className="text-red-600">*</span>
              </label>
              <select
                value={bloodGroupNeeded}
                onChange={(e) => setBloodGroupNeeded(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Units Required <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              />
            </div>
          </div>

          {/* Hospital Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hospital / Patient Location <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="e.g. Manipal Hospital, HAL Old Airport Road, Bengaluru"
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              />
            </div>
          </div>

          {/* Geolocation Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hospital Coordinates (GeoJSON [Lon, Lat])
                </span>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
              >
                <span>{isDetectingLocation ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
              </button>
            </div>

            {locationSuccess && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>GPS coordinates captured successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Longitude (1st)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.5946"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Latitude (2nd)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 12.9716"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setLongitude(78.4867);
                  setLatitude(17.3850);
                  setHospitalAddress(prev => prev || 'NIMS Hospital, Punjagutta, Hyderabad');
                }}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
              >
                Hyderabad
              </button>
              <button
                type="button"
                onClick={() => {
                  setLongitude(77.5946);
                  setLatitude(12.9716);
                  setHospitalAddress(prev => prev || 'Manipal Hospital, HAL Airport Rd, Bengaluru');
                }}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                Bengaluru
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Used for the 15 km MongoDB 2DSphere query to alert nearby available donors.
            </p>
          </div>

          {/* Privacy Notice Box */}
          <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-100 text-xs text-red-950 flex items-start space-x-2.5">
            <Layers className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Consent-First Protection:</strong> Individual donors within 15 km will receive an automated WhatsApp notification. Their phone numbers will remain <strong>completely masked</strong> until they tap "Accept" on WhatsApp.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-200 transition active:scale-95 disabled:opacity-60 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Broadcasting Request...</span>
                </>
              ) : (
                <span>Broadcast Emergency Alert</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestModal;
