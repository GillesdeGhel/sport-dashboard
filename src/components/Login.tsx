import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🏸</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Sport Dashboard</h1>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full h-11 px-3 mb-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full h-11 px-3 mb-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />

        {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default Login;
