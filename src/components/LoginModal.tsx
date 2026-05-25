import React, { useState } from 'react';
import { X, Shield, Lock, User, Sparkles, Mail, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

interface SavedHost {
  name: string;
  email: string;
  passwordHash: string;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load registered hosts from localStorage with default preloaded accounts
  const getRegisteredHosts = (): SavedHost[] => {
    const saved = localStorage.getItem('aluga_itb_registered_hosts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // empty fallback
      }
    }
    // Seed default hosts so they have valid loggable logins
    const defaults: SavedHost[] = [
      { name: 'Beatriz S. (Anfitriã)', email: 'beatriz@alugaitb.com.br', passwordHash: '123456' },
      { name: 'Tapajós Studio Owner', email: 'studio@alugaitb.com.br', passwordHash: '123456' },
      { name: 'Clínica Perpétuo Socorro', email: 'clinica@alugaitb.com.br', passwordHash: '123456' }
    ];
    return defaults;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userVal = loginEmail.trim();
    const passVal = loginPassword.trim();

    if (!userVal || !passVal) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    // Check Admin Login (arilsonveras / Isaac#2023)
    if (
      (userVal.toLowerCase() === 'arilsonveras' || userVal.toLowerCase() === 'admin@alugaambiente.com.br') &&
      passVal === 'Isaac#2023'
    ) {
      const adminProfile: UserProfile = {
        name: 'Arilson Veras',
        email: 'admin@alugaambiente.com.br',
        role: 'admin',
        balance: 470
      };
      onLoginSuccess(adminProfile);
      return;
    }

    // Check host list
    const hosts = getRegisteredHosts();
    const foundHost = hosts.find(
      h => h.email.toLowerCase() === userVal.toLowerCase() && h.passwordHash === passVal
    );

    if (foundHost) {
      const ownerProfile: UserProfile = {
        name: foundHost.name,
        email: foundHost.email,
        role: 'owner',
        balance: foundHost.email === 'beatriz@alugaitb.com.br' ? 1450 : 0
      };
      onLoginSuccess(ownerProfile);
      return;
    }

    // Generic error
    setErrorMessage('Credenciais incorretas. Caso seja administrador ou anfitrião credenciado, tente novamente com dados válidos.');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameVal = registerName.trim();
    const emailVal = registerEmail.trim();
    const passVal = registerPassword.trim();
    const confirmVal = registerConfirmPassword.trim();

    if (!nameVal || !emailVal || !passVal || !confirmVal) {
      setErrorMessage('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (passVal.length < 4) {
      setErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (passVal !== confirmVal) {
      setErrorMessage('As senhas não coincidem!');
      return;
    }

    // Block reserving admin account name
    if (emailVal.toLowerCase().includes('admin@alugaambiente') || nameVal.toLowerCase().includes('arilsonveras')) {
      setErrorMessage('Este e-mail ou nome é reservado para a administração do site.');
      return;
    }

    const hosts = getRegisteredHosts();
    
    // Check duplication
    if (hosts.some(h => h.email.toLowerCase() === emailVal.toLowerCase())) {
      setErrorMessage('Este endereço de e-mail já está cadastrado como anfitrião.');
      return;
    }

    const newHost: SavedHost = {
      name: nameVal,
      email: emailVal,
      passwordHash: passVal
    };

    const updatedHosts = [...hosts, newHost];
    localStorage.setItem('aluga_itb_registered_hosts', JSON.stringify(updatedHosts));

    setSuccessMessage('Anfitrião registrado com sucesso! Conectando...');
    
    setTimeout(() => {
      const ownerProfile: UserProfile = {
        name: nameVal,
        email: emailVal,
        role: 'owner',
        balance: 0
      };
      onLoginSuccess(ownerProfile);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl leading-none flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base leading-none">
                Área Restrita Aluga ITB
              </h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                Acesso para ADM & Anfitriões
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-50 border-b border-slate-100 text-xs font-bold select-none shrink-0">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            Acessar Conta
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            Cadastrar-se como Anfitrião
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-150 text-red-600 text-xs font-medium rounded-xl leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Faça login para gerenciar seus espaços, visualizar e confirmar locações efetuadas por clientes no seu calendário.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Ex: arilsonveras ou beatriz@alugaitb.com.br"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Superar Autenticação & Acessar
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Cadastre seus imóveis, salões ou salas comerciais no Aluga ITB e passe a governar as locações com controle automático pelo Google Agenda!
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Ex: Beatriz Alavanca"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Seu E-mail de Trabalho
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="Ex: beatriz@alugaitb.com.br"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Definir Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Mín. 4 digitos"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Repetir Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Concluir Registro de Anfitrião
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
