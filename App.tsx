
import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('user_id');
    const savedUsername = localStorage.getItem('username');
    const savedToken = localStorage.getItem('access_token');

    if (savedUserId && savedToken) {
      setUser({
        id: savedUserId,
        username: savedUsername || savedUserId,
        token: savedToken
      });
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    localStorage.setItem('user_id', newUser.id);
    localStorage.setItem('username', newUser.username);
    localStorage.setItem('access_token', newUser.token || '');
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-futuristic text-sky-500">
        INITIALIZING SYSTEM...
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-sky-500/30">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
