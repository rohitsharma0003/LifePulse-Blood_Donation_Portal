import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplet,
  User as UserIcon,
  Phone,
  Lock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { registerUser } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [longitude, setLongitude] = useState('78.4867');
  const [latitude, setLatitude] = useState('17.3850');
  const [isDonorAvailable, setIsDonorAvailable] = useState(true);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-attempt geolocation capture when page loads
  useEffect(() => {
    handleCaptureGPS();
  }, []);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      // Keep sensible default coordinates (Hyderabad center)
      setLongitude('78.4867');
      setLatitude('17.3850');
      return;
    }

    setIsDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // GeoJSON standard: [longitude, latitude]
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        setLongitude(lng.toString());
        setLatitude(lat.toString());
        setIsDetectingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn('Geolocation capture failed or denied:', err);
        // Fallback default coordinates (Hyderabad healthcare hub)
        setLongitude('78.4867');
        setLatitude('17.3850');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !password) {
      setError('Please fill in all required profile fields.');
      return;
    }

    const lngNum = parseFloat(longitude);
    const latNum = parseFloat(latitude);

    if (isNaN(lngNum) || isNaN(latNum)) {
      setError('Please capture or enter valid numerical coordinates [longitude, latitude].');
      return;
    }

    setIsLoading(true);

    try {
      // Coordinates MUST be [longitude, latitude]
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        password,
        bloodGroup,
        coordinates: [lngNum, latNum],
        isDonorAvailable
      };

      const data = await registerUser(payload);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/40 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 mb-3 animate-pulse-subtle">
          <Droplet className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Unified Account
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          One account to request blood in emergencies & donate to save nearby lives
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* Phone & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone (WhatsApp Alert) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Blood Group <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  >
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* GPS Location Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Donor / Requester GPS Coordinates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isDetectingLocation ? 'Capturing GPS...' : 'Capture GPS Location'}</span>
                </button>
              </div>

              {locationSuccess && (
                <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GPS location captured: [{longitude}, {latitude}]</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Longitude (GeoJSON 1st)
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
                    Latitude (GeoJSON 2nd)
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
                    setLongitude('78.4867');
                    setLatitude('17.3850');
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                >
                  Hyderabad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLongitude('77.5946');
                    setLatitude('12.9716');
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                >
                  Bengaluru
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Stored in standard GeoJSON [longitude, latitude] format for 15 km 2DSphere radius queries.
              </p>
            </div>

            {/* Ready to Donate Initial Toggle */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Available for Emergency Blood Donation
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  You can toggle this at any time from your dashboard.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDonorAvailable}
                  onChange={(e) => setIsDonorAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Privacy Safeguard Info */}
            <div className="flex items-start space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Zero Spam Guarantee:</strong> Your contact information will never be publicly exposed. It is only shared if you explicitly accept an alert for a patient in need.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-200 transition active:scale-98 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
