import { useState } from 'react';
import UsernameForm from './components/UsernameForm';
import Game from './pages/Game';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [username, setUsername] = useState(null);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
  };

  if (!username) {
    return <UsernameForm onSubmit={handleUsernameSubmit} />;
  }

  return <Game username={username} apiUrl={API_URL} wsUrl={WS_URL} />;
}

export default App;
