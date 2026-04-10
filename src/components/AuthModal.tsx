import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
} from 'firebase/auth';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup' | 'reset' | 'verify-pending';

// Italian-friendly error mapping for Firebase Auth
function mapAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Indirizzo email non valido.';
    case 'auth/user-disabled': return 'Questo account è stato disabilitato.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Email o password non corretti.';
    case 'auth/email-already-in-use': return 'Esiste già un account con questa email. Prova ad accedere.';
    case 'auth/weak-password': return 'La password è troppo debole. Usa almeno 8 caratteri con lettere e numeri.';
    case 'auth/too-many-requests': return 'Troppi tentativi. Riprova tra qualche minuto.';
    case 'auth/network-request-failed': return 'Errore di connessione. Controlla la rete e riprova.';
    case 'auth/popup-closed-by-user': return 'Finestra di accesso chiusa prima di completare l\'operazione.';
    case 'auth/popup-blocked': return 'Il browser ha bloccato il popup. Abilitalo e riprova.';
    case 'auth/operation-not-allowed': return 'Metodo di accesso non abilitato. Contatta il supporto.';
    default: return fallback;
  }
}

function getPasswordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['Molto debole', 'Debole', 'Discreta', 'Buona', 'Forte', 'Eccellente'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
  return { score, label: labels[score], color: colors[score] };
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const resetState = () => {
    setError('');
    setInfo('');
  };

  const switchMode = (next: Mode) => {
    resetState();
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    try {
      // Persistence: "Ricordami" = local, altrimenti session-only
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          // Re-invia il link di verifica e blocca l'accesso
          try { await sendEmailVerification(cred.user); } catch {}
          await signOut(auth);
          setMode('verify-pending');
          setInfo(`Per accedere devi prima verificare la tua email. Ti abbiamo appena rinviato il link a ${cred.user.email}.`);
          setLoading(false);
          return;
        }
        onClose();
      } else if (mode === 'signup') {
        if (!acceptTerms) {
          setError('Devi accettare i Termini di Servizio e la Privacy Policy per continuare.');
          setLoading(false);
          return;
        }
        if (strength.score < 3) {
          setError('Scegli una password più sicura: almeno 8 caratteri, con maiuscole, minuscole e numeri.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        // Invia email di verifica Firebase (silenzioso)
        try {
          await sendEmailVerification(userCredential.user);
        } catch (verifyErr) {
          console.warn('Email verification failed (non-blocking):', verifyErr);
        }
        // Invia email di benvenuto custom (silenzioso, fallisce in prod statica)
        try {
          await fetch('/api/emails/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userCredential.user.email, name }),
          });
        } catch (emailErr) {
          console.warn('Welcome email failed (non-blocking):', emailErr);
        }
        // Blocca l'accesso finché non verifica l'email
        const newUserEmail = userCredential.user.email;
        await signOut(auth);
        setMode('verify-pending');
        setInfo(`Account creato! Ti abbiamo inviato un link di verifica a ${newUserEmail}. Conferma l'email per accedere.`);
        setLoading(false);
        return;
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setInfo('Ti abbiamo inviato un link per reimpostare la password. Controlla la tua casella email (anche lo spam).');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error(err);
      setError(mapAuthError(error?.code, error?.message || 'Si è verificato un errore.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetState();
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error(err);
      setError(mapAuthError(error?.code, error?.message || 'Errore con Google Sign In.'));
    }
  };


  if (!isOpen) return null;

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';
  const isVerifyPending = mode === 'verify-pending';

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row my-auto"
        >
          {/* Left Side - Image */}
          <div className="hidden md:block md:w-1/2 relative">
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Studio Equipment"
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-end p-10">
              <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Entra nel club</h3>
              <p className="text-zinc-300 mb-6">Unisciti a migliaia di professionisti dell'audio. Offerte esclusive, supporto prioritario e molto altro.</p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-brand-orange" />
                <span>Connessione cifrata · Dati protetti · GDPR compliant</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 relative z-10 bg-zinc-950">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-brand-orange/10 blur-[60px] pointer-events-none"></div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8 text-center md:text-left">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-brand-orange/20 mx-auto md:mx-0">
                {isReset && <Lock className="w-8 h-8 text-white" />}
                {isVerifyPending && <Mail className="w-8 h-8 text-white" />}
                {!isReset && !isVerifyPending && <User className="w-8 h-8 text-white" />}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-2">
                {isLogin && 'Bentornato'}
                {isSignup && 'Crea Account'}
                {isReset && 'Recupera Password'}
                {isVerifyPending && 'Verifica la tua email'}
              </h2>
              <p className="text-zinc-400 text-sm">
                {isLogin && 'Accedi per continuare i tuoi acquisti'}
                {isSignup && 'Unisciti a noi per un\'esperienza audio premium'}
                {isReset && 'Inserisci la tua email e ti invieremo un link sicuro per reimpostare la password.'}
                {isVerifyPending && 'Apri il link che ti abbiamo inviato per attivare il tuo account, poi torna qui per accedere.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
            {info && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{info}</p>
              </div>
            )}

            {isVerifyPending && (
              <div className="space-y-5">
                <div className="p-5 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-zinc-300 leading-relaxed">
                  <p className="mb-3"><strong className="text-white">Cosa fare ora:</strong></p>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                    <li>Apri la tua casella email</li>
                    <li>Clicca sul link "Verifica indirizzo email"</li>
                    <li>Torna qui e accedi normalmente</li>
                  </ol>
                  <p className="mt-3 text-xs text-zinc-500">Non trovi l'email? Controlla anche la cartella spam o promozioni.</p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full py-4 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all shadow-lg shadow-brand-orange/20"
                >
                  Ho verificato, accedi
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Torna all'accesso
                </button>
              </div>
            )}

            {!isVerifyPending && <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Nome completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-zinc-500 group-focus-within:text-brand-orange transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                      placeholder="Mario Rossi"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-brand-orange transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {!isReset && (
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-xs text-brand-orange hover:text-orange-400 font-bold transition-colors"
                      >
                        Password dimenticata?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-brand-orange transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all"
                      placeholder="••••••••"
                      required
                      minLength={isSignup ? 8 : 6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {isSignup && password.length > 0 && (
                    <div className="mt-3 px-1">
                      <div className="flex gap-1 mb-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${i < strength.score ? strength.color : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Sicurezza password: <span className="font-bold text-zinc-300">{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isLogin && (
                <div className="flex items-center gap-2 ml-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-brand-orange focus:ring-brand-orange focus:ring-offset-0"
                  />
                  <label htmlFor="remember-me" className="text-sm text-zinc-400 cursor-pointer">Ricordami su questo dispositivo</label>
                </div>
              )}

              {isSignup && (
                <div className="flex items-start gap-2 ml-1">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-zinc-900 text-brand-orange focus:ring-brand-orange focus:ring-offset-0"
                  />
                  <label htmlFor="accept-terms" className="text-xs text-zinc-400 cursor-pointer leading-relaxed">
                    Accetto i <a href="#" className="text-brand-orange hover:underline">Termini di Servizio</a> e la <a href="#" className="text-brand-orange hover:underline">Privacy Policy</a>.
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-orange/20 mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Attendere...</span>
                  </div>
                ) : (
                  <>
                    {isLogin && 'Accedi'}
                    {isSignup && 'Crea account'}
                    {isReset && 'Invia link di recupero'}
                  </>
                )}
              </button>

              {isReset && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Torna all'accesso
                </button>
              )}
            </form>}

            {!isReset && !isVerifyPending && (
              <>
                <div className="mt-8 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="px-4 bg-zinc-950 text-zinc-500">Oppure continua con</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/10 bg-zinc-900/50 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="font-medium">Continua con Google</span>
                  </button>
                </div>

                <p className="mt-8 text-center text-sm text-zinc-400">
                  {isLogin ? "Non hai un account? " : "Hai già un account? "}
                  <button
                    onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                    className="text-brand-orange hover:text-orange-400 font-bold transition-colors"
                  >
                    {isLogin ? 'Registrati ora' : 'Accedi qui'}
                  </button>
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protetto da Firebase Authentication</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
