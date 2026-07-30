import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { RegistrosSobras } from './pages/RegistrosSobras';
import { Entradas } from './pages/Entradas';
import { Aproveitamento } from './pages/Aproveitamento';
import { PrevisaoCompras } from './pages/PrevisaoCompras';
import { Produtos } from './pages/Produtos';
import { Usuarios } from './pages/Usuarios';
import { HistoricoVersoes } from './pages/HistoricoVersoes';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('controle_sobras_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Erro ao restaurar sessão de usuário:', e);
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewState, setViewState] = useState<'login' | 'forgot-password' | 'reset-password' | 'app'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Modais globais acionados pelo Header
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [isSobraModalOpen, setIsSobraModalOpen] = useState(false);

  useEffect(() => {
    // Checar se existe token na URL para redefinição de senha
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setViewState('reset-password');
      return;
    }

    if (currentUser) {
      setViewState('app');
    } else {
      setViewState('login');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User, token: string) => {
    try {
      localStorage.setItem('controle_sobras_token', token);
      localStorage.setItem('controle_sobras_user', JSON.stringify(user));
    } catch (e) {
      console.error('Erro ao salvar credenciais:', e);
    }
    setCurrentUser(user);
    setViewState('app');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('controle_sobras_token');
    localStorage.removeItem('controle_sobras_user');
    setCurrentUser(null);
    setViewState('login');
  };

  // Renderizar telas de auth se deslogado
  if (viewState === 'reset-password' && resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setViewState('login');
        }}
      />
    );
  }

  if (viewState === 'forgot-password') {
    return <ForgotPassword onBackToLogin={() => setViewState('login')} />;
  }

  if (viewState === 'login' || !currentUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToForgotPassword={() => setViewState('forgot-password')}
      />
    );
  }

  // Renderizar layout principal do sistema SaaS
  return (
    <div className="min-h-screen flex bg-[#fcfbf9]">
      {/* Menu Lateral Fixo com Rodapé de Copyright e Versionamento */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onOpenNovaEntrada={() => {
            setActiveTab('entradas');
            setIsEntradaModalOpen(true);
          }}
          onOpenRegistrarSobra={() => {
            setActiveTab('registros');
            setIsSobraModalOpen(true);
          }}
          onOpenVersoes={() => {
            setActiveTab('versoes');
          }}
        />

        <main className="p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'registros' && (
            <RegistrosSobras
              isModalOpen={isSobraModalOpen}
              setIsModalOpen={setIsSobraModalOpen}
            />
          )}
          {activeTab === 'entradas' && (
            <Entradas
              isModalOpen={isEntradaModalOpen}
              setIsModalOpen={setIsEntradaModalOpen}
            />
          )}
          {activeTab === 'aproveitamento' && <Aproveitamento />}
          {activeTab === 'previsao' && <PrevisaoCompras />}
          {activeTab === 'produtos' && <Produtos />}
          {activeTab === 'usuarios' && <Usuarios />}
          {activeTab === 'versoes' && <HistoricoVersoes />}
        </main>
      </div>
    </div>
  );
};
