import React from 'react';
import Dashboard from './components/dashboard/Dashboard';
import { StackProvider } from './context/StackContext';

function App() {
  return (
    <StackProvider>
      <div className="h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden">
        <Dashboard />
      </div>
    </StackProvider>
  );
}

export default App;
