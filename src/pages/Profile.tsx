import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Camera,
  Lock,
  Check,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Save,
  LogOut,
  Trash2,
} from 'lucide-react';
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  User as FirebaseUser,
  sendEmailVerification,
} from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, storage } from '../firebase';

interface ProfileProps {
  onNavigate: (page: string) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setDisplayName(u?.displayName || '');
      setLoading(false);
      if (!u) onNavigate('home');
    });
    return () => unsub();
  }, [onNavigate]);

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isPasswordProvider = user?.providerData.some((p) => p.providerId === 'password');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile(user, { displayName: displayName.trim() || null });
      setProfileMessage({ type: 'success', text: 'Profilo aggiornato con successo.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Errore nel salvataggio.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Seleziona un file immagine valido.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'L\'immagine deve essere inferiore a 5 MB.' });
      return;
    }

    setUploadingPhoto(true);
    setProfileMessage(null);
    try {
      const path = `avatars/${user.uid}/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      await updateProfile(user, { photoURL: url });
      setProfileMessage({ type: 'success', text: 'Immagine del profilo aggiornata.' });
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Errore caricando l\'immagine.' });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !user.photoURL) return;
    setUploadingPhoto(true);
    setProfileMessage(null);
    try {
      // Best effort delete (URL might be external e.g. Google)
      try {
        if (user.photoURL.includes('firebasestorage')) {
          const decoded = decodeURIComponent(user.photoURL.split('/o/')[1].split('?')[0]);
          await deleteObject(storageRef(storage, decoded));
        }
      } catch {}
      await updateProfile(user, { photoURL: null });
      setProfileMessage({ type: 'success', text: 'Immagine del profilo rimossa.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Errore.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setPwdMessage(null);

    if (newPwd.length < 8) {
      setPwdMessage({ type: 'error', text: 'La nuova password deve avere almeno 8 caratteri.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMessage({ type: 'error', text: 'Le password non coincidono.' });
      return;
    }

    setSavingPwd(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      setPwdMessage({ type: 'success', text: 'Password aggiornata con successo.' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      const code = err?.code;
      let text = 'Errore aggiornando la password.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') text = 'Password attuale non corretta.';
      else if (code === 'auth/weak-password') text = 'La nuova password è troppo debole.';
      else if (code === 'auth/too-many-requests') text = 'Troppi tentativi. Riprova più tardi.';
      setPwdMessage({ type: 'error', text });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setProfileMessage({ type: 'success', text: 'Email di verifica inviata. Controlla la casella.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onNavigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange mb-3">— Il tuo account</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">Profilo</h1>
          <p className="text-zinc-400 text-lg">Gestisci le tue informazioni personali e la sicurezza dell'account.</p>
        </motion.div>

        {/* Avatar + identity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profilo"
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-orange/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center text-4xl font-black border-4 border-brand-orange/30">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-10 h-10 bg-brand-orange hover:bg-orange-500 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                title="Cambia immagine"
              >
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-black mb-1">{user.displayName || 'Utente'}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 mb-3">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>

              {user.emailVerified ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Email verificata
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    Email non verificata
                  </span>
                  <button onClick={handleResendVerification} className="text-xs font-bold text-brand-orange hover:text-orange-400">
                    Rinvia link
                  </button>
                </div>
              )}

              {user.photoURL && (
                <button
                  onClick={handleRemovePhoto}
                  className="block mt-4 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Rimuovi immagine
                </button>
              )}
            </div>
          </div>

          {profileMessage && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {profileMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p>{profileMessage.text}</p>
            </div>
          )}
        </motion.div>

        {/* Personal info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-brand-orange" />
            </div>
            <h3 className="text-xl font-black">Informazioni personali</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Nome visualizzato</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/30 text-zinc-500 cursor-not-allowed"
              />
              <p className="mt-2 ml-1 text-xs text-zinc-600">L'email non può essere modificata.</p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-brand-orange/20"
            >
              {savingProfile ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salva modifiche
            </button>
          </form>
        </motion.div>

        {/* Password change — only for password provider */}
        {isPasswordProvider && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-950 border border-white/10 rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand-orange" />
              </div>
              <h3 className="text-xl font-black">Sicurezza & Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Password attuale</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Nuova password</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Conferma nuova password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                />
              </div>

              {pwdMessage && (
                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  pwdMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {pwdMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <p>{pwdMessage.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPwd}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-brand-orange/20"
              >
                {savingPwd ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Aggiorna password
              </button>
            </form>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Esci dall'account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
