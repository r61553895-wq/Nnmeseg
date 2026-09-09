import React, { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle2, ShieldCheck, Database, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signOut, type FirebaseUser } from '../../firebase';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  firebaseUser: FirebaseUser | null;
  onLoginSuccess: (fbUser: FirebaseUser) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  firebaseUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLoginSuccess(result.user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(err.message || 'Ошибка авторизации через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      onLogout();
      onClose();
    } catch (err: any) {
      console.error('Sign-out error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-md rounded-2xl bg-[#11131c] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {firebaseUser ? 'Облачный профиль Firebase' : 'Вход в облачную базу данных'}
                </h3>
                <p className="text-[11px] text-zinc-400">Google Cloud Firestore</p>
              </div>
            </div>
            <button
              id="close-auth-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {firebaseUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3.5">
                  <img
                    src={firebaseUser.photoURL || currentUser.avatar}
                    alt={firebaseUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate">
                        {firebaseUser.displayName || currentUser.name}
                      </span>
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{firebaseUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-400 font-medium">Подключено к Firestore</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <Sparkles size={14} /> База данных активна в реальном времени
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Все отправленные сообщения, реакции и новые диалоги сохраняются в Google Cloud Firestore.
                  </p>
                </div>

                <button
                  id="sign-out-btn"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <LogOut size={15} />
                  <span>{loading ? 'Выход...' : 'Выйти из аккаунта'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <h4 className="text-base font-semibold text-zinc-100">
                    Авторизация в реальном мессенджере
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Войдите через Google, чтобы получить постоянный облачный профиль в базе данных Firestore, общаться с реальными пользователями и сохранять историю сообщений.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Настоящая база данных Google Cloud Firestore</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Синхронизация между устройствами и вкладками</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Общий список зарегистрированных пользователей</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="google-sign-in-modal-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-white/5 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Вход в систему...' : 'Войти с помощью Google'}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
