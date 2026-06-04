import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../Common/Button';

interface ProfileProps {
  onNavigate: (route: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, updateUser, connectionStatus } = useStore();
  const { success, error } = useNotifications();

  // Fallback default avatar URL
  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuD_mxd2hKaK4VvUDRS51r4z3ZNiQ2C1eRzIK_W2adwv88lVe5yUNzynVvPVQkOvk4mHpn1koVRQuTTm_BmIBlQoVN4n6CbNYs0jE5eFcmzBxp6zamshohtAbFjqCNrM9nbCdLn1Ek1NyPQUtmNmSN5U3rD9joRoJQCFaYNWbfQsL7cGFFfro7Oc5K45fHXtvW7FIqmUbaQMdJp603D4xeuze7Ij32OOO_vYCBGlexzGGi6FyyyYSXvArDtePWcItKuWM5hr1MjGfnbs";

  // Form states initialized with current user details or premium defaults
  const [name, setName] = useState(user?.name || 'Ramesh Kumar');
  const [email, setEmail] = useState(user?.email || 'ramesh.guardian@rentverify.in');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || defaultAvatar);
  const [propertyName, setPropertyName] = useState(user?.propertyName || 'Greenwood Heights Apartment 302B');
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          success('Local profile image loaded. Remember to click Save!');
        }
      };
      reader.onerror = () => {
        error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Full Name cannot be empty');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Update persistent context store
      updateUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        propertyName: propertyName.trim(),
      });
      
      success('Guardian Profile updated successfully!');
      setTimeout(() => {
        setIsSaving(false);
        onNavigate('dashboard');
      }, 600);
    } catch (err) {
      setIsSaving(false);
      error('Failed to update profile');
    }
  };

  const handleResetAvatar = () => {
    setAvatarUrl(defaultAvatar);
    success('Avatar reset to default secure portrait');
  };

  return (
    <main className="max-w-xl mx-auto px-container-margin pt-4 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant -mx-container-margin px-container-margin py-3.5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex size-8 items-center justify-center rounded-full hover:bg-surface-container transition-colors -ml-1 text-on-surface"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
            <h1 className="text-on-surface text-lg font-bold">Guardian Profile</h1>
          </div>
          <div className="flex items-center gap-1">
            <span className={`block h-1.5 w-1.5 rounded-full ${
              connectionStatus === 'online' ? 'bg-[#10b981]' :
              connectionStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-error'
            }`} />
            <span className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {connectionStatus === 'online' ? 'Cloud' : 'Local'}
            </span>
          </div>
        </div>
      </header>

      {/* Form Card */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Avatar Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-primary-container to-[#1b365d] opacity-90" />
          
          <div 
            className="relative mt-4 shrink-0 cursor-pointer group" 
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload profile photo"
          >
            <div 
              className="size-24 rounded-full border-4 border-surface bg-cover bg-center shadow-lg relative overflow-hidden bg-surface-container transition-transform group-hover:scale-[1.03] duration-200"
              style={{ backgroundImage: `url(${avatarUrl || defaultAvatar})` }}
            />
            <div className="absolute bottom-0 right-0 size-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-md border-2 border-surface transition-transform group-hover:scale-110 duration-200">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-on-surface text-base font-bold">{name || 'Ramesh Kumar'}</h2>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">{user?.role === 'admin' ? 'Property Guardian Admin' : 'Security Guardian'}</p>
            <p className="text-[10px] text-outline font-medium">Username: @{user?.username || 'admin'}</p>
          </div>

          <div className="flex gap-2 w-full max-w-xs justify-center pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-secondary hover:bg-primary text-white text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">upload</span>
              Upload Photo
            </button>
            <button
              type="button"
              onClick={handleResetAvatar}
              className="px-3.5 py-1.5 bg-surface-container border border-outline-variant text-[11px] font-bold text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Reset Avatar
            </button>
          </div>
        </section>

        {/* Profile Details Edit Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">account_box</span>
            Personal Details
          </h3>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              className="w-full px-3.5 py-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-phone" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Mobile Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              className="w-full px-3.5 py-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-email" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              className="w-full px-3.5 py-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh.kumar@email.com"
            />
          </div>
        </section>

        {/* Property Information Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">apartment</span>
            Property Management
          </h3>

          {/* Property Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-property" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Managed Property Address / Name
            </label>
            <input
              id="profile-property"
              type="text"
              className="w-full px-3.5 py-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g. Greenwood Heights Apartment 302B"
            />
          </div>

          {/* Profile Image URL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-avatar-url" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Avatar Image URL
            </label>
            <input
              id="profile-avatar-url"
              type="url"
              className="w-full px-3.5 py-3 bg-surface-container border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-medium outline-none transition-all text-xs"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                <span>Save Profile Changes</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onNavigate('dashboard')}
            className="w-full py-3.5 font-bold rounded-2xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
};

export default Profile;
