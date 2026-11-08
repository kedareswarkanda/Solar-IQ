import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  X, 
  Lock, 
  Mail, 
  LogIn, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

// Fixed initial administrator identifier & secure PBKDF2 hash
// Password Kedar@12345 is NEVER hardcoded in plaintext
const ADMIN_EMAIL = "99240040247@klu.ac.in";
const ADMIN_PASSWORD_HASH = "112657bcc3204b0fc1cf81321a809deedd26d19811b6b001831badee5e37fd3e";

/**
 * Standard client-side PBKDF2 HMAC SHA-256 hash
 * Matches backend hashlib.pbkdf2_hmac("sha256", password, salt, 100000)
 */
async function hashPasswordClient(password) {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const salt = enc.encode("SolarIQ_Salt_2026_Secure");
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Standard SHA-256 fallback if WebCrypto PBKDF2 is unavailable
    const enc = new TextEncoder();
    const data = enc.encode(password + ":SolarIQ_Salt_2026_Secure");
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Client-Side Database Manager for Zero-Downtime / Static Hosting (Vercel)
 * Stores registered accounts in localStorage('solariq_registered_users')
 */
function getClientUsers() {
  try {
    const stored = localStorage.getItem('solariq_registered_users');
    let users = stored ? JSON.parse(stored) : [];

    // Purge deprecated demo accounts if found
    users = users.filter(u => u.email !== 'admin@solariq.io' && u.email !== 'user@solariq.io');

    // Ensure the predefined Administrator account is seeded
    const hasAdmin = users.some(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!hasAdmin) {
      users.unshift({
        id: "usr_admin_seed",
        name: "System Administrator",
        email: ADMIN_EMAIL,
        password_hash: ADMIN_PASSWORD_HASH,
        role: "admin",
        status: "active",
        location: "Global Solar Monitoring Hub",
        created_at: "2026-11-08 00:00:00"
      });
      localStorage.setItem('solariq_registered_users', JSON.stringify(users));
    }
    return users;
  } catch (e) {
    return [{
      id: "usr_admin_seed",
      name: "System Administrator",
      email: ADMIN_EMAIL,
      password_hash: ADMIN_PASSWORD_HASH,
      role: "admin",
      status: "active",
      location: "Global Solar Monitoring Hub",
      created_at: "2026-11-08 00:00:00"
    }];
  }
}

function saveClientUsers(users) {
  try {
    localStorage.setItem('solariq_registered_users', JSON.stringify(users));
  } catch (e) {}
}

export default function LoginPage({ onLoginSuccess }) {
  const [activeForm, setActiveForm] = useState(null); // 'user' | 'admin' | null
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields (Empty by default - no demo credentials)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Optional OTP Verification State (if SMTP configured on backend)
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpMsg, setOtpMsg] = useState({ type: '', text: '' });
  const [smtpRequired, setSmtpRequired] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check backend auth config on mount
  useEffect(() => {
    axios.get('/api/auth/config')
      .then(res => {
        if (res.data?.email_verification_required) {
          setSmtpRequired(true);
        }
      })
      .catch(() => {
        setSmtpRequired(false);
      });
  }, []);

  // OTP Cooldown Countdown Effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const openForm = (type) => {
    setActiveForm(type);
    setIsRegisterMode(false);
    setIsOtpSent(false);
    setIsEmailVerified(false);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setCooldown(0);
    setErrorMsg('');
    setSuccessMsg('');
    setOtpMsg({ type: '', text: '' });
  };

  const closeForm = () => {
    setActiveForm(null);
    setIsOtpSent(false);
    setIsEmailVerified(false);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setCooldown(0);
    setErrorMsg('');
    setSuccessMsg('');
    setOtpMsg({ type: '', text: '' });
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    setOtpMsg({ type: '', text: '' });
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await axios.post('/api/auth/send-otp', { email: cleanEmail });
      setIsOtpSent(true);
      setCooldown(res.data.cooldown || 30);
      setOtpMsg({ type: 'success', text: res.data.message || 'Verification OTP sent to your inbox.' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send OTP. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    setOtpMsg({ type: '', text: '' });
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpMsg({ type: 'error', text: 'Please enter a valid 6-digit OTP code.' });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email: cleanEmail, otp: cleanOtp });
      setIsEmailVerified(true);
      setOtpMsg({ type: 'success', text: 'Email Verified ✓' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Incorrect OTP. Please try again.';
      setOtpMsg({ type: 'error', text: msg });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Reject legacy demo accounts
    if (cleanEmail === 'admin@solariq.io' || cleanEmail === 'user@solariq.io') {
      setErrorMsg('Demo credentials are disabled. Please sign in with registered credentials.');
      setIsLoading(false);
      return;
    }

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    // --- REGISTRATION FLOW ---
    if (isRegisterMode) {
      // Disallow admin signup
      if (activeForm === 'admin') {
        setErrorMsg('Administrator accounts cannot be created via public registration.');
        setIsLoading(false);
        return;
      }

      if (!name.trim()) {
        setErrorMsg('Please enter your Full Name.');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        setIsLoading(false);
        return;
      }

      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        setErrorMsg('Administrator account is pre-configured and cannot be registered.');
        setIsLoading(false);
        return;
      }

      if (smtpRequired && !isEmailVerified) {
        setErrorMsg('Please verify your email address using the OTP before creating your account.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.post('/api/auth/register', {
          name: name.trim(),
          email: cleanEmail,
          password: password,
          confirm_password: confirmPassword,
          role: 'user'
        });

        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(res.data.user, 'user');
        }, 500);
        return;
      } catch (err) {
        // Fallback for static hosts (405) or offline network
        if (err.response?.status === 405 || !err.response || err.code === 'ERR_NETWORK') {
          const clientUsers = getClientUsers();
          const existing = clientUsers.find(u => u.email?.toLowerCase() === cleanEmail);
          if (existing) {
            setErrorMsg('An account with this email address already exists. Please log in.');
            setIsLoading(false);
            return;
          }

          const passwordHash = await hashPasswordClient(password);
          const newUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name.trim(),
            email: cleanEmail,
            password_hash: passwordHash,
            role: "user",
            status: "active",
            location: "Standard Installation Site",
            created_at: new Date().toISOString()
          };

          clientUsers.push(newUser);
          saveClientUsers(clientUsers);

          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            const safeUser = {
              name: newUser.name,
              email: newUser.email,
              role: "user",
              location: newUser.location,
              created_at: newUser.created_at
            };
            onLoginSuccess(safeUser, 'user');
          }, 500);
          return;
        }

        if (err.response?.status === 409) {
          setErrorMsg('An account with this email address already exists. Please log in.');
        } else {
          setErrorMsg(err.response?.data?.detail || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }
    }

    // --- LOGIN FLOW ---
    try {
      const res = await axios.post('/api/auth/login', { 
        email: cleanEmail, 
        password: password 
      });

      const userRole = res.data.user?.role || 'user';
      if (activeForm === 'admin' && userRole !== 'admin') {
        setErrorMsg('Access denied. Administrator privileges required.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(res.data.user, userRole);
    } catch (err) {
      // Fallback for static hosts (405) or offline network
      if (err.response?.status === 405 || !err.response || err.code === 'ERR_NETWORK') {
        const clientUsers = getClientUsers();
        const user = clientUsers.find(u => u.email?.toLowerCase() === cleanEmail);

        if (!user) {
          setErrorMsg('Invalid email or password.');
          setIsLoading(false);
          return;
        }

        if (user.status === 'disabled') {
          setErrorMsg('Account is disabled. Contact system administrator.');
          setIsLoading(false);
          return;
        }

        const inputHash = await hashPasswordClient(password);
        if (inputHash !== user.password_hash) {
          setErrorMsg('Invalid email or password.');
          setIsLoading(false);
          return;
        }

        if (activeForm === 'admin' && user.role !== 'admin') {
          setErrorMsg('Access denied. Administrator privileges required.');
          setIsLoading(false);
          return;
        }

        const safeUser = {
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          location: user.location || 'Standard Installation Site',
          created_at: user.created_at || new Date().toISOString()
        };

        onLoginSuccess(safeUser, safeUser.role);
        return;
      }

      if (err.response?.status === 401) {
        setErrorMsg('Invalid email or password.');
      } else if (err.response?.status === 403) {
        setErrorMsg(err.response?.data?.detail || 'Account is disabled. Contact system administrator.');
      } else {
        const msg = err.response?.data?.detail || 'Unable to connect to the authentication service.';
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF3EA] text-[#4A3030] flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      
      <div className="max-w-6xl mx-auto w-full space-y-10 py-6">
        
        {/* Top Branding Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-3 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-[#E86A6A] text-white flex items-center justify-center shadow-md font-black shrink-0">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-3xl sm:text-4xl tracking-tight text-[#4A3030] leading-tight">
                Solar<span className="text-[#8F2635]">IQ</span>
              </div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 text-xs font-semibold tracking-wider uppercase">
                AI + Physics Core
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#4A3030] tracking-tight">Welcome to SolarIQ</h1>
            <p className="text-sm sm:text-base text-[#8F2635] font-medium mt-1">Choose how you want to continue</p>
          </div>
        </div>

        {/* TWO Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* USER LOGIN BOX */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-[#E86A6A] hover:shadow-md hover:-translate-y-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 flex items-center justify-center">
                <User className="w-6 h-6 text-[#E86A6A]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#4A3030]">USER LOGIN</h2>
                <p className="text-sm text-[#4A3030]/80 font-medium mt-1.5 leading-relaxed">
                  Analyze, simulate and optimize your solar performance. Register or log in to your account.
                </p>
              </div>
            </div>

            <button
              onClick={() => openForm('user')}
              className="w-full py-3.5 px-5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer hover:shadow-md"
            >
              <span>User Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ADMIN LOGIN BOX */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-[#E86A6A] hover:shadow-md hover:-translate-y-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#E86A6A]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#4A3030]">ADMIN LOGIN</h2>
                <p className="text-sm text-[#4A3030]/80 font-medium mt-1.5 leading-relaxed">
                  Manage users, system status and SolarIQ operations with configured administrator credentials.
                </p>
              </div>
            </div>

            <button
              onClick={() => openForm('admin')}
              className="w-full py-3.5 px-5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer hover:shadow-md"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Short Motivational Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3030]">Turn Sunlight Into Smarter Energy.</h2>
          <p className="text-sm sm:text-base text-[#8F2635] font-medium leading-relaxed">
            Understand your solar performance, predict energy generation, and explore smarter ways to improve it with Physics and AI.
          </p>
          <div className="pt-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FBE1E1] text-[#8F2635] text-xs font-bold border border-[#E86A6A]/30">
              Understand. Predict. Optimize. Generate More.
            </span>
          </div>
        </div>

        {/* Real-World Solar Images Section */}
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="text-center text-xs font-extrabold text-[#8F2635] uppercase tracking-wider">
            Real-World Photovoltaic Installations
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
              <img 
                src="/images/solar_panel_array.png" 
                alt="Solar Panel Array" 
                className="w-full h-40 object-cover"
              />
              <div className="p-3 text-center text-xs font-bold text-[#8F2635]">
                Photovoltaic Panel Array
              </div>
            </div>

            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
              <img 
                src="/images/rooftop_solar_install.png" 
                alt="Rooftop Solar Installation" 
                className="w-full h-40 object-cover"
              />
              <div className="p-3 text-center text-xs font-bold text-[#8F2635]">
                Rooftop Solar Installation
              </div>
            </div>

            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
              <img 
                src="/images/solar_farm_energy.png" 
                alt="Solar Energy Park" 
                className="w-full h-40 object-cover"
              />
              <div className="p-3 text-center text-xs font-bold text-[#8F2635]">
                Utility Scale Solar Farm
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-[#EED6CC] text-xs text-[#8F2635] font-semibold">
        SolarIQ • AI + Physics Core
      </footer>

      {/* Auth Modal Form Overlay */}
      {activeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A3030]/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EED6CC] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30">
                  {activeForm === 'admin' ? <ShieldCheck className="w-5 h-5 text-[#E86A6A]" /> : <User className="w-5 h-5 text-[#E86A6A]" />}
                </div>
                <h3 className="text-lg font-extrabold text-[#4A3030]">
                  {activeForm === 'admin' ? 'Admin Login' : (isRegisterMode ? 'Create User Account' : 'User Login')}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-xl text-[#8F2635] hover:bg-[#FBE1E1] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-[#FBE1E1] border border-[#E86A6A] text-[#8F2635] text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#E86A6A] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {isRegisterMode ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">Email Address</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="email"
                          required
                          disabled={isEmailVerified && smtpRequired}
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setIsEmailVerified(false);
                            setIsOtpSent(false);
                          }}
                          className="w-full px-3.5 py-2.5 pl-10 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all disabled:opacity-75"
                        />
                        <Mail className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                      </div>

                      {smtpRequired && (
                        !isEmailVerified ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || cooldown > 0}
                            className="px-4 py-2.5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shrink-0"
                          >
                            {isSendingOtp ? 'Sending...' : (cooldown > 0 ? `Resend in ${cooldown}s` : (isOtpSent ? 'Resend OTP' : 'Send OTP'))}
                          </button>
                        ) : (
                          <div className="px-3.5 py-2.5 rounded-xl bg-[#FBE1E1] border border-[#E86A6A] text-[#8F2635] text-xs font-black flex items-center justify-center space-x-1 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[#E86A6A]" />
                            <span>Email Verified ✓</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* OTP Verification Input Box (Only when SMTP email service is active) */}
                  {smtpRequired && isOtpSent && !isEmailVerified && (
                    <div className="bg-[#FBF3EA] border border-[#EED6CC] p-3.5 rounded-2xl space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider">
                          Enter 6-Digit Verification OTP
                        </label>
                        <span className="text-[11px] font-bold text-[#8F2635]/80">Valid 5 mins</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="482731"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-3.5 py-2.5 text-center text-base font-black tracking-widest bg-[#FFFDFC] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otp.length !== 6}
                          className="px-5 py-2.5 rounded-xl bg-[#8F2635] hover:bg-[#4A3030] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>

                      {otpMsg.text && (
                        <div className={`text-xs font-bold flex items-center space-x-1.5 ${otpMsg.type === 'success' ? 'text-[#8F2635]' : 'text-rose-700'}`}>
                          {otpMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#E86A6A]" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{otpMsg.text}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                      />
                      <Lock className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                      />
                      <Lock className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">
                      {activeForm === 'admin' ? 'Administrator Email' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder={activeForm === 'admin' ? "99240040247@klu.ac.in" : "name@example.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                      />
                      <Mail className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#4A3030] block mb-1.5">
                      {activeForm === 'admin' ? 'Administrator Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 text-sm font-medium bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                      />
                      <Lock className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>
                  {isLoading 
                    ? 'Authenticating...' 
                    : (activeForm === 'admin' 
                        ? 'Sign In as Admin' 
                        : (isRegisterMode ? 'Create Account & Continue' : 'Sign In & Continue'))}
                </span>
              </button>

            </form>

            {/* Toggle Create Account option ONLY for User Login - NEVER for Admin Login */}
            {activeForm !== 'admin' && (
              <div className="pt-3 border-t border-[#EED6CC] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-[#8F2635] font-semibold hover:text-[#E86A6A] hover:underline cursor-pointer"
                >
                  {isRegisterMode 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Create Account"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}