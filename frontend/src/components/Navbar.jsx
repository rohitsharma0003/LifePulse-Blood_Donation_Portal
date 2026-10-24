import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, LogOut, User as UserIcon, Heart, PlusCircle } from 'lucide-react';

const Navbar = ({ user, onToggleDonor, isToggling, onOpenRequestModal }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-200 group-hover:bg-red-700 transition">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-red-600 transition">
                Life<span className="text-red-600">Pulse</span>
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-medium">
                Emergency Blood Network
              </span>
            </div>
          </Link>

          {/* User Controls */}
          {user && (
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Quick Request Button */}
              {onOpenRequestModal && (
                <button
                  type="button"
                  onClick={onOpenRequestModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Request Blood</span>
                </button>
              )}

              {/* Donor Quick Toggle Pill */}
              {onToggleDonor && (
                <button
                  type="button"
                  onClick={onToggleDonor}
                  disabled={isToggling}
                  title="Click to toggle your donor availability"
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95 ${
                    user.isDonorAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.isDonorAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {isToggling
                      ? 'Updating...'
                      : user.isDonorAvailable
                      ? 'Donor Available'
                      : 'Donor Offline'}
                  </span>
                </button>
              )}

              {/* User Blood Group Badge */}
              <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                <span>Group: {user.bloodGroup}</span>
              </div>

              {/* User Profile Info */}
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="hidden lg:inline-block font-medium truncate max-w-[120px]">
                  {user.name}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
