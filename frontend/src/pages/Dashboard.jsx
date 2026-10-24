import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Droplet,
  PlusCircle,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import Navbar from '../components/Navbar';
import RequestModal from '../components/RequestModal';
import { getMyProfile, toggleDonorAvailability, getMyRequests } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleSuccessMsg, setToggleSuccessMsg] = useState('');

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileData, requestsData] = await Promise.all([
        getMyProfile(),
        getMyRequests()
      ]);

      setUser(profileData.user);
      setRequests(requestsData.requests || []);
      // Keep cached local copy in sync
      localStorage.setItem('user', JSON.stringify(profileData.user));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDonor = async () => {
    if (isToggling) return;
    setIsToggling(true);
    setToggleSuccessMsg('');

    try {
      const data = await toggleDonorAvailability();
      setUser((prev) => ({
        ...prev,
        isDonorAvailable: data.isDonorAvailable
      }));

      // Update stored user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.isDonorAvailable = data.isDonorAvailable;
      localStorage.setItem('user', JSON.stringify(stored));

      setToggleSuccessMsg(data.message);
      setTimeout(() => setToggleSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to toggle donor availability:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRequestCreated = (newReq) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading your LifePulse dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Navbar with embedded quick actions */}
      <Navbar
        user={user}
        onToggleDonor={handleToggleDonor}
        isToggling={isToggling}
        onOpenRequestModal={() => setIsModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome & Profile Overview Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-200/50 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unified LifePulse Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-sm text-red-100 max-w-xl leading-relaxed">
                Your account is primed to request blood in times of emergency and answer critical donation alerts in your neighborhood.
              </p>

              {/* Profile Details Pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                <span className="px-3 py-1 rounded-lg bg-white/15 backdrop-blur flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-200 fill-red-200" />
                  <span>Blood Group: {user?.bloodGroup}</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/15 backdrop-blur flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-200" />
                  <span>{user?.phone}</span>
                </span>
                {user?.location?.coordinates && (
                  <span className="px-3 py-1 rounded-lg bg-white/15 backdrop-blur flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-200" />
                    <span>
                      [{user.location.coordinates[0].toFixed(3)}, {user.location.coordinates[1].toFixed(3)}]
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Request Trigger */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-white text-red-600 hover:bg-red-50 font-bold text-sm shadow-lg transition active:scale-95"
              >
                <PlusCircle className="w-5 h-5 text-red-600" />
                <span>Initiate Blood Request</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Alert if status toggled */}
        {toggleSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-2.5 shadow-sm animate-fade-in">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{toggleSuccessMsg}</span>
          </div>
        )}

        {/* Interactive "Ready to Donate" Toggle Switch Card */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 shadow-sm ${
            user?.isDonorAvailable
              ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200'
              : 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition ${
                  user?.isDonorAvailable
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                <Droplet
                  className={`w-7 h-7 ${
                    user?.isDonorAvailable ? 'fill-white animate-pulse' : ''
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Ready to Donate Status
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user?.isDonorAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {user?.isDonorAvailable ? 'ACTIVE DONOR' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {user?.isDonorAvailable
                    ? 'You are active in the 15 km emergency radius! When a patient or hospital nearby needs your blood group, you will receive an automated WhatsApp notification. Your contact details remain masked until you choose to accept.'
                    : 'You are currently offline. You will not receive any urgent WhatsApp donation requests until you flip this toggle back on.'}
                </p>
              </div>
            </div>

            {/* Big Interactive Toggle Switch */}
            <div className="flex items-center space-x-3 self-end sm:self-center flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {user?.isDonorAvailable ? 'Available' : 'Unavailable'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={user?.isDonorAvailable}
                onClick={handleToggleDonor}
                disabled={isToggling}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                  user?.isDonorAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                    user?.isDonorAvailable ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* User Blood Requests Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Your Emergency Blood Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track real-time public blood bank stock and donor WhatsApp responses
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 transition"
              title="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Droplet className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  No Active Blood Requests
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  When you or a patient in your care urgently requires blood, create a request to instantly query local blood banks and alert nearby donors within 15 km.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-200 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Blood Request</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Blood Group Badge & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 font-black text-xl flex items-center justify-center shadow-xs">
                          {req.bloodGroupNeeded}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Required
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {req.unitsNeeded} Unit{req.unitsNeeded > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          req.status === 'OPEN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Hospital Address */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-start space-x-2 text-xs text-slate-600">
                        <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">{req.hospitalAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Donor Notification Metrics */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Alerts Sent
                        </span>
                        <span className="font-bold text-slate-800">
                          {req.totalNotified ?? '—'} Donors
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Confirmed (Consent Given)
                        </span>
                        <span className="font-bold text-emerald-600">
                          {req.acceptedCount ?? 0} Accepted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    to={`/requests/${req._id}/search`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-bold text-xs transition duration-200 shadow-sm"
                  >
                    <span>View Banks & Confirmed Donors</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Emergency Request Modal */}
      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleRequestCreated}
      />
    </div>
  );
};

export default Dashboard;
