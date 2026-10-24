import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  Droplet,
  Heart,
  AlertCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  getRequestDetails,
  getAcceptedDonors,
  getNearbyBanks,
  getMyProfile,
  toggleDonorAvailability
} from '../services/api';

const SearchResults = () => {
  const { id } = useParams(); // requestId

  const [currentUser, setCurrentUser] = useState(null);
  const [request, setRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('banks'); // 'banks' | 'donors'

  const [bloodBanks, setBloodBanks] = useState([]);
  const [acceptedDonors, setAcceptedDonors] = useState([]);
  const [stats, setStats] = useState({
    totalNotified: 0,
    pendingCount: 0,
    acceptedCount: 0,
    declinedCount: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllData();
  }, [id]);

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const [profileData, reqData, donorsData, banksData] = await Promise.all([
        getMyProfile().catch(() => ({ user: null })),
        getRequestDetails(id),
        getAcceptedDonors(id),
        getNearbyBanks(id)
      ]);

      if (profileData?.user) setCurrentUser(profileData.user);
      setRequest(reqData.request);
      setAcceptedDonors(donorsData.acceptedDonors || []);
      setStats(donorsData.stats || {});
      setBloodBanks(banksData.bloodBanks || []);
    } catch (err) {
      console.error('Error fetching search results data:', err);
      setError(err.message || 'Failed to load request search results.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const cleanPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Querying nearby blood banks and checking donor WhatsApp acceptances...
          </p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl p-6 text-center space-y-4 border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Request Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'Unable to locate this emergency request.'}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Breadcrumb & Refresh */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-red-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => loadAllData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing Acceptances...' : 'Check New Responses'}</span>
          </button>
        </div>

        {/* Emergency Request Highlight Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 overflow-hidden relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-red-200 flex-shrink-0">
                <span className="text-2xl leading-none">{request.bloodGroupNeeded}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5 opacity-90">Needed</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Emergency Match Center
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {request.status}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{request.hospitalAddress}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                  <span>Units Needed: <strong className="text-slate-800">{request.unitsNeeded} unit(s)</strong></span>
                  <span>•</span>
                  <span>
                    Hospital GPS: <strong className="font-mono text-slate-700">[{request.hospitalCoordinates?.join(', ')}]</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Logged: {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-center px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Alerts Sent
                </span>
                <span className="text-lg font-black text-slate-800">
                  {stats.totalNotified} Donors
                </span>
              </div>
              <div className="text-center px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Confirmed (Consent)
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {acceptedDonors.length} Accepted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('banks')}
            className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'banks'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tier 1: Public Blood Banks</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {bloodBanks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donors')}
            className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'donors'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tier 2: Confirmed Donors</span>
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                acceptedDonors.length > 0
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {acceptedDonors.length}
            </span>
          </button>
        </div>

        {/* TAB 1: BLOOD BANKS */}
        {activeTab === 'banks' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Tier 1 Match:</strong> Public blood banks sorted by proximity to the hospital. Call or send a direct WhatsApp message to reserve the available units in real-time.
              </p>
            </div>

            {bloodBanks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Blood Banks Found Nearby</h3>
                <p className="text-xs text-slate-500">
                  Ensure sample blood banks are seeded by executing <code>npm run seed</code> in the backend.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bloodBanks.map((bank) => {
                  const cleanPhone = cleanPhoneForWhatsApp(bank.phone);
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${bank.name}, I am reaching out regarding an urgent requirement for ${request.unitsNeeded} unit(s) of ${request.bloodGroupNeeded} blood for a patient at ${request.hospitalAddress}.`
                  )}`;

                  return (
                    <div
                      key={bank._id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">
                            {bank.name}
                          </h3>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                            {bank.distanceKm} km away
                          </span>
                        </div>

                        <div className="flex items-start space-x-2 text-xs text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{bank.address}</span>
                        </div>

                        {/* Stock for Requested Blood Group */}
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-red-900">
                            Available {request.bloodGroupNeeded} Stock:
                          </span>
                          <span className="text-sm font-black text-red-700 bg-white px-2.5 py-0.5 rounded-lg border border-red-200">
                            {bank.availableUnitsForGroup} Unit{bank.availableUnitsForGroup !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Mini Inventory Snapshot */}
                        {bank.inventory && (
                          <div className="pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Total Inventory Snapshot
                            </span>
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {Object.entries(
                                bank.inventory.toJSON ? bank.inventory.toJSON() : bank.inventory
                              ).map(([grp, count]) => (
                                <span
                                  key={grp}
                                  className={`px-2 py-0.5 rounded-md font-medium ${
                                    grp === request.bloodGroupNeeded
                                      ? 'bg-red-600 text-white font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {grp}: {count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={`tel:${bank.phone}`}
                          className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Bank</span>
                        </a>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIRMED INDIVIDUAL DONORS */}
        {activeTab === 'donors' && (
          <div className="space-y-5 animate-fade-in">
            {/* Privacy & Protocol Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Tier 2 Consent-First Protocol</p>
                <p className="leading-relaxed">
                  Individual donors within a 15 km radius were sent automated WhatsApp emergency alerts with request details. Donor contact numbers remain strictly <strong>MASKED</strong> until they open their WhatsApp alert and tap "Accept". Donors who have provided explicit consent are displayed below.
                </p>
              </div>
            </div>

            {/* Waiting / Empty State */}
            {acceptedDonors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-lg font-bold text-slate-900">
                    Waiting for Donor Confirmations...
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automated WhatsApp alerts have been dispatched to <strong>{stats.totalNotified}</strong> matching available donors within 15 km of the hospital.
                    As soon as any donor taps <strong>"Accept"</strong> on WhatsApp, their full name, phone number, and distance will instantly appear here.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => loadAllData(true)}
                    disabled={isRefreshing}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 transition active:scale-95"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Check for New Acceptances</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {acceptedDonors.length} Verified Donor{acceptedDonors.length > 1 ? 's' : ''} Consented & Ready to Help
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Contact details unmasked with donor permission
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {acceptedDonors.map((item) => {
                    const donor = item.donor;
                    const cleanPhone = cleanPhoneForWhatsApp(donor.phone);
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${donor.name}, thank you for accepting our urgent blood donation request for ${request.bloodGroupNeeded} blood at ${request.hospitalAddress}. When might you be able to visit the hospital?`
                    )}`;

                    return (
                      <div
                        key={item.responseId}
                        className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Header: Donor Name & Group */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <h3 className="font-bold text-slate-900 text-base">
                                {donor.name}
                              </h3>
                              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Accepted on WhatsApp</span>
                              </span>
                            </div>

                            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 font-black text-sm flex items-center justify-center">
                              {donor.bloodGroup}
                            </span>
                          </div>

                          {/* Distance & Contact Info */}
                          <div className="space-y-2 pt-1 text-xs text-slate-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                              <span className="font-semibold text-slate-800">
                                ~{donor.distanceKm} km away from hospital
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="font-mono font-bold text-slate-900">
                                {donor.phone}
                              </span>
                            </div>

                            {item.respondedAt && (
                              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Accepted {new Date(item.respondedAt).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={`tel:${donor.phone}`}
                            className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Donor</span>
                          </a>

                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
