import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Heart,
  Droplet,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { respondToRequest, getResponseDetails } from '../services/api';

const RespondRequest = () => {
  const [searchParams] = useSearchParams();

  const reqId = searchParams.get('req');
  const donorId = searchParams.get('donor');
  const initialAction = searchParams.get('action'); // 'accept' | 'decline'

  const [requestInfo, setRequestInfo] = useState(null);
  const [donorInfo, setDonorInfo] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reqId || !donorId) {
      setError('Invalid request link. Missing request or donor identifiers.');
      setIsLoading(false);
      return;
    }

    initResponseFlow();
  }, [reqId, donorId]);

  const initResponseFlow = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Fetch details of this request and donor
      const details = await getResponseDetails(reqId, donorId);
      setRequestInfo(details.request);
      setDonorInfo(details.donor);
      setCurrentStatus(details.currentStatus);

      // 2. If an action was specifically passed in the query params (e.g. WhatsApp tap), process it automatically
      if (initialAction) {
        await processResponse(initialAction);
      }
    } catch (err) {
      console.error('Failed to load response info:', err);
      setError(err.message || 'Unable to retrieve the blood emergency details.');
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = async (actionToPerform) => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await respondToRequest({
        requestId: reqId,
        donorId,
        action: actionToPerform
      });

      setCurrentStatus(result.status);
      setFeedbackMessage(result.message);

      if (result.request) {
        setRequestInfo((prev) => ({
          ...prev,
          ...result.request
        }));
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError(err.message || 'Failed to update response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Connecting to LifePulse Emergency Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 mb-2">
            <Droplet className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Life<span className="text-red-600">Pulse</span> Emergency Response
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Two-Tier Consent-First Blood Donor Verification
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {error ? (
            <div className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Request Error</h2>
              <p className="text-sm text-slate-600">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                <span>Go to Portal Home</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div>
              {/* Dynamic Status Header */}
              {currentStatus === 'ACCEPTED' ? (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-white text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black">Thank You for Saving a Life!</h2>
                  <p className="text-xs text-emerald-100 max-w-sm mx-auto leading-relaxed">
                    You have consented to donate. Your verified phone number has been unlocked for the hospital requester.
                  </p>
                </div>
              ) : currentStatus === 'DECLINED' ? (
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-8 text-white text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-1">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black">Request Declined</h2>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Thank you for letting us know. Your contact information remains completely masked and protected.
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-8 text-white text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-1">
                    <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black">Emergency Blood Request</h2>
                  <p className="text-xs text-red-100 max-w-sm mx-auto leading-relaxed">
                    A patient within 15 km of your location needs blood. Please confirm your willingness to donate.
                  </p>
                </div>
              )}

              {/* Request Details Content */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Highlight Info Box */}
                {requestInfo && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Blood Group Required
                        </span>
                        <span className="text-2xl font-black text-red-600">
                          {requestInfo.bloodGroupNeeded}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Required Units
                        </span>
                        <span className="text-base font-bold text-slate-900">
                          {requestInfo.unitsNeeded} unit(s)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-start space-x-2 text-xs text-slate-700">
                        <Building2 className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">{requestInfo.hospitalAddress}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-6">
                        Requested by: <strong>{requestInfo.requesterName}</strong>
                      </div>
                    </div>

                    {/* Requester Contact info if accepted */}
                    {requestInfo.requesterPhone && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
                          <Phone className="w-4 h-4 text-emerald-600" />
                          <span>Requester Direct Phone:</span>
                        </div>
                        <a
                          href={`tel:${requestInfo.requesterPhone}`}
                          className="font-mono font-bold text-emerald-700 underline"
                        >
                          {requestInfo.requesterPhone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Donor Status & Action Confirmation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Responding as: <strong>{donorInfo?.name || 'Registered Donor'}</strong> ({donorInfo?.bloodGroup})</span>
                    <span>Current Status: <strong className="uppercase text-slate-800">{currentStatus}</strong></span>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => processResponse('accept')}
                      disabled={isSubmitting || currentStatus === 'ACCEPTED'}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{currentStatus === 'ACCEPTED' ? 'Accepted' : 'Accept Request'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => processResponse('decline')}
                      disabled={isSubmitting || currentStatus === 'DECLINED'}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-300 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{currentStatus === 'DECLINED' ? 'Declined' : 'Decline'}</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Your phone number is only revealed if you click <strong>Accept</strong>. If you decline, your contact details remain completely anonymous.
                  </span>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <span>Go to LifePulse Portal Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RespondRequest;
