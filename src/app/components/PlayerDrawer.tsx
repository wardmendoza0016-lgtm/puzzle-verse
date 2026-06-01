import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Settings, LogOut, Grid, Check, ChevronLeft, AlertCircle, Camera } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface PlayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export default function PlayerDrawer({ isOpen, onClose, session }: PlayerDrawerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Avatar Upload States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !session?.user?.id) return;

    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setEditName(data.full_name || '');
        setEditUsername(data.username || '');
      }
      setLoading(false);
    }

    fetchProfile();
    setIsEditing(false);
    setError('');
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [isOpen, session]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation: images only, max 2MB
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
    
    // Trigger immediate upload
    handleAvatarUpload(file);
  };

  const uploadAvatarToStorage = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      // Use user ID as filename so each user always overwrites their own file
      const filePath = `${session.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      setError(err.message || 'Avatar upload failed.');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      setError('');
      
      if (!file) {
        throw new Error('You must select an image to upload.');
      }

      const fileExt = file.name.split('.').pop();
      // Store the file inside a folder named after the user's ID
      const filePath = `${session.user.id}/avatar.${fileExt}`;

      // 1. Upload the file to the 'avatars' bucket (upsert replaces the old one if it exists)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add a cache-buster to prevent stale images
      const finalUrl = `${publicUrl}?v=${Date.now()}`;

      console.log('✓ Upload successful. URL:', finalUrl);

      // 3. Instantly update the profiles table with the new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('✓ Database updated with new avatar URL');

      // 4. Update the local UI state so it shows up immediately
      setProfile({ ...profile, avatar_url: finalUrl });
      setAvatarFile(null);
      setAvatarPreview(null);
      setError('');
      console.log('✓ UI state updated');
      
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Error uploading image.');
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');

    const cleanUsername = editUsername.trim().toLowerCase();
    const cleanName = editName.trim();

    try {
      // Avatar is either already uploaded (in profile.avatar_url) or we generate dicebear
      const finalAvatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          username: cleanUsername,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Save profile error:', updateError);
        if (updateError.code === '23505') {
          throw new Error('That username is already taken. Try another one!');
        }
        throw updateError;
      }

      console.log('✓ Profile saved successfully with avatar:', finalAvatarUrl);
      setProfile({ ...profile, full_name: cleanName, username: cleanUsername, avatar_url: finalAvatarUrl });
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Priority: local file preview → saved profile URL → dicebear fallback
  // In edit mode without a file picked, still show dicebear live-preview on username change
  const displayAvatar = avatarPreview
    ? avatarPreview
    : isEditing
    ? (profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${editUsername.trim().toLowerCase()}`)
    : (profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.email}`);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-sm h-full bg-[#090b12]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_50px_rgba(59,42,96,0.5)] z-[101] flex flex-col font-['Space_Grotesk'] text-white overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button onClick={() => setIsEditing(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer mr-1">
                    <ChevronLeft className="w-5 h-5 text-[#d3c5f6]" />
                  </button>
                )}
                <h2 className="text-xl font-bold font-['Outfit'] tracking-wide">
                  {isEditing ? 'Edit Profile' : 'Player Profile'}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-[#d3c5f6]" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center animate-pulse text-[#d3c5f6]">Loading Stats...</div>
            ) : (
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">

                {/* Avatar Display / Upload Button */}
                <div className="pt-8 pb-4 flex flex-col items-center justify-center relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#b966ff] rounded-full blur-[60px] opacity-20 pointer-events-none" />

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  {/* Clickable only in edit mode */}
                  <div
                    onClick={() => isEditing && fileInputRef.current?.click()}
                    className={`relative w-28 h-28 rounded-full p-1 bg-gradient-to-br from-[#d3c5f6] to-[#3b2a60] shadow-[0_0_30px_rgba(211,197,246,0.3)] transition-all duration-300 group ${isEditing ? 'cursor-pointer' : ''}`}
                  >
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover bg-[#090b12]"
                    />
                    {/* Upload Overlay (Only visible in Edit Mode) */}
                    {isEditing && (
                      <div className="absolute inset-1 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                        <span className="text-[9px] text-white font-bold mt-1 tracking-wide">
                          {uploading ? 'UPLOADING...' : 'CHANGE'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge shown when a new file is staged */}
                  {avatarPreview && (
                    <span className="mt-2 text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                      ✓ New photo ready
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {/* === EDIT MODE PANEL === */}
                  {isEditing ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-8 space-y-5"
                    >
                      <p className="text-xs text-center text-[#d3c5f6]/60 mb-2">
                        Tap your avatar to upload a photo, or change your username for a new robot avatar.
                      </p>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Username</label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
                        />
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          onClick={() => { setIsEditing(false); setAvatarFile(null); setAvatarPreview(null); }}
                          disabled={saving || uploadingAvatar}
                          className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving || uploadingAvatar || !editUsername.trim() || !editName.trim()}
                          className="flex-1 px-4 py-3 rounded-lg bg-[#d3c5f6] text-[#3b2a60] text-sm font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(211,197,246,0.2)] disabled:opacity-50"
                        >
                          {saving || uploadingAvatar
                            ? 'Saving...'
                            : <><Check className="w-4 h-4" /> Save Profile</>
                          }
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* === VIEW MODE PANEL === */
                    <motion.div
                      key="view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="pb-8"
                    >
                      <div className="flex flex-col items-center mb-8">
                        <h3 className="text-2xl font-extrabold font-['Outfit']">{profile?.full_name || 'Puzzle Player'}</h3>
                        <p className="text-[#d3c5f6]/80 font-medium">@{profile?.username || 'user'}</p>
                      </div>

                      <div className="px-6 mb-8">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-400 mb-2" />
                            <span className="text-2xl font-bold font-['Outfit']">{profile?.completed_inventory?.length || 0}</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/50 text-center">Puzzles Solved</span>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
                            <Grid className="w-6 h-6 text-cyan-400 mb-2" />
                            <span className="text-2xl font-bold font-['Outfit']">0</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/50 text-center">Lobbies Hosted</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 space-y-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors text-left border border-transparent hover:border-white/10 cursor-pointer"
                        >
                          <Settings className="w-5 h-5 text-[#d3c5f6]" />
                          <span className="font-medium">Account Settings</span>
                        </button>
                        <button
                          onClick={() => supabase.auth.signOut()}
                          className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 transition-colors text-left border border-transparent hover:border-red-500/20 text-red-400 cursor-pointer"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}