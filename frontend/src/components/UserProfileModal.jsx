import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  MapPin, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  BarChart2,
  Bookmark,
  Shield,
  Upload,
  Camera,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';

export default function UserProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const safeUser = user || {};

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'password'

  // Edit Profile Form State
  const [name, setName] = useState(safeUser.name || '');
  const [location, setLocation] = useState(safeUser.location || 'Standard Installation Site');
  const [photo, setPhoto] = useState(safeUser.photo || '');
  const [previewPhoto, setPreviewPhoto] = useState(safeUser.photo || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Live Camera State & Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const u = user || {};
      setName(u.name || '');
      setLocation(u.location || 'Standard Installation Site');
      setPhoto(u.photo || '');
      setPreviewPhoto(u.photo || '');
      setSelectedFile(null);
      setImgError(false);
      setProfileMsg({ type: '', text: '' });
      setPassMsg({ type: '', text: '' });
    }
  }, [user, isOpen]);


  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setProfileMsg({ type: 'error', text: 'Please select a JPG, PNG, or WEBP image under 5 MB.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Please select a JPG, PNG, or WEBP image under 5 MB.' });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhoto(objectUrl);
    setPreviewPhoto(objectUrl);
    setProfileMsg({ type: 'success', text: 'Photo selected! Click "Save Profile Changes" to upload.' });
  };

  const handleStartCamera = async () => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setMediaStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setCameraError('Camera access was denied. You can upload a photo instead.');
    }
  };

  const handleStopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `captured_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(blob);
      setPhoto(previewUrl);
      setPreviewPhoto(previewUrl);
      setProfileMsg({ type: 'success', text: 'Photo captured! Click "Save Profile Changes" to upload.' });
      handleStopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }
    setIsUpdatingProfile(true);

    try {
      let finalPhotoUrl = photo;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const photoRes = await axios.post('/api/user/profile/photo', formData);
        if (photoRes.data && photoRes.data.photo_url) {
          finalPhotoUrl = photoRes.data.photo_url;
        }
      }

      const res = await axios.post('/api/auth/profile', { name, location, photo: finalPhotoUrl });
      setPhoto(finalPhotoUrl);
      setPreviewPhoto(finalPhotoUrl);
      setSelectedFile(null);
      setImgError(false);
      setProfileMsg({ type: 'success', text: res.data.message || 'Profile updated successfully.' });
      
      const updatedUser = { ...user, name, location, photo: finalPhotoUrl };
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Unable to save profile changes. Please try again.'
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    setIsUpdatingPass(true);
    try {
      const res = await axios.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPassMsg({ type: 'success', text: res.data.message || 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed changing password. Check current password.'
      });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#4A3030]/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl shadow-2xl w-[calc(100vw-24px)] sm:w-full max-w-xl max-h-[calc(100dvh-24px)] sm:max-h-[90vh] flex flex-col overflow-hidden font-sans transform transition-all">
        
        {/* Header Bar */}
        <div className="bg-[#8F2635] text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            {!imgError && (photo || previewPhoto || safeUser.photo) ? (
              <img 
                src={photo || previewPhoto || safeUser.photo} 
                alt={safeUser.name || 'User Avatar'} 
                onError={() => setImgError(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-white/30 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-lg sm:text-xl border border-white/20 shrink-0">
                {(name || safeUser.name || safeUser.email || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight truncate">{name || safeUser.name || 'SolarIQ User'}</h2>
              <div className="flex items-center space-x-2 mt-0.5 min-w-0">
                <span className="text-[11px] sm:text-xs text-amber-100/90 font-medium truncate">{safeUser.email}</span>
                <span className="bg-[#FBE1E1] text-[#8F2635] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {safeUser.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EED6CC] bg-[#FBF3EA] shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-2 sm:px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 sm:space-x-2 ${
              activeTab === 'details'
                ? 'border-[#E86A6A] text-[#8F2635] bg-[#FFFDFC]'
                : 'border-transparent text-[#4A3030] hover:text-[#8F2635]'
            }`}
          >
            <User className="w-4 h-4 text-[#E86A6A] shrink-0" />
            <span className="truncate">Profile Information</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 px-2 sm:px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 sm:space-x-2 ${
              activeTab === 'password'
                ? 'border-[#E86A6A] text-[#8F2635] bg-[#FFFDFC]'
                : 'border-transparent text-[#4A3030] hover:text-[#8F2635]'
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#E86A6A] shrink-0" />
            <span className="truncate">Security & Password</span>
          </button>
        </div>

        {/* Content Body Container */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto overflow-x-hidden min-w-0">

          
          {activeTab === 'details' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              {profileMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  profileMsg.type === 'success' ? 'bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#E86A6A]" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Account Stats Summary Pills */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-[#FBF3EA] border border-[#EED6CC] p-3 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
                    <BarChart2 className="w-4 h-4 text-[#E86A6A]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8F2635] uppercase font-extrabold tracking-wider block">Analyses Run</span>
                    <span className="text-lg font-black text-[#4A3030]">{safeUser.num_analyses || 0}</span>
                  </div>
                </div>

                <div className="bg-[#FBF3EA] border border-[#EED6CC] p-3 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
                    <Bookmark className="w-4 h-4 text-[#E86A6A]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8F2635] uppercase font-extrabold tracking-wider block">Saved Scenarios</span>
                    <span className="text-lg font-black text-[#4A3030]">{safeUser.num_scenarios || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                    placeholder="Your Full Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  Email Address (Read-Only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4A3030]/50 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={safeUser.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5E6D3]/60 border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030]/70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  Installation / Site Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                    placeholder="City, State / Site Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-2">
                  PROFILE PHOTO
                </label>

                {/* Guidance Instruction */}
                <div className="bg-[#FBF3EA] border border-[#EED6CC] p-3.5 rounded-2xl mb-3 space-y-1.5">
                  <p className="text-xs font-bold text-[#4A3030]">
                    Upload a clear passport-size photo with your full face visible.
                  </p>
                  <ul className="text-[11px] text-[#8F2635] font-medium grid grid-cols-2 gap-1 list-disc list-inside">
                    <li>Clear face & good lighting</li>
                    <li>Face centered</li>
                    <li>No heavy blur</li>
                    <li>Avoid sunglasses</li>
                  </ul>
                </div>

                {/* Photo Action Buttons & Preview Box */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FBF3EA] border border-[#EED6CC] p-4 rounded-2xl">
                  {/* Passport-Style Preview Frame */}
                  <div className="w-28 h-36 rounded-2xl border-2 border-[#EED6CC] bg-[#FFFDFC] shadow-xs overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {!imgError && (previewPhoto || photo) ? (
                      <img
                        src={previewPhoto || photo}
                        alt="Passport Profile Preview"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <User className="w-8 h-8 text-[#8F2635]/40 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-[#8F2635]/60 block leading-tight">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#FBE1E1] hover:bg-[#E86A6A] text-[#8F2635] hover:text-white border border-[#E86A6A]/30 text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Live Photo</span>
                      </button>
                    </div>

                    {(photo || selectedFile) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto('');
                          setPreviewPhoto('');
                          setSelectedFile(null);
                        }}
                        className="text-[11px] text-[#8F2635] font-bold hover:underline cursor-pointer block"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 border-t border-[#EED6CC]">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#4A3030] border border-[#EED6CC] text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>

            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 animate-fade-in">
              
              {passMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  passMsg.type === 'success' ? 'bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#E86A6A] shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-3 text-[#8F2635] hover:text-[#E86A6A] cursor-pointer"
                    title={showOldPassword ? "Hide password" : "Show password"}
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-[#8F2635] hover:text-[#E86A6A] cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8F2635] absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-2 focus:ring-[#E86A6A]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-[#8F2635] hover:text-[#E86A6A] cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 border-t border-[#EED6CC]">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#4A3030] border border-[#EED6CC] text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isUpdatingPass ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>


            </form>
          )}

        </div>

      </div>

      {/* Live Photo Capture Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#4A3030]/75 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#EED6CC] pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-[#E86A6A]" />
                <h3 className="text-base font-extrabold text-[#4A3030]">Live Photo Capture</h3>
              </div>
              <button
                onClick={handleStopCamera}
                className="p-1.5 rounded-xl text-[#8F2635] hover:bg-[#FBE1E1] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-[#EED6CC] aspect-4/3 max-h-72 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none rounded-2xl m-4 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">Center face inside box</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-2 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#4A3030] border border-[#EED6CC] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              {!cameraError && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
