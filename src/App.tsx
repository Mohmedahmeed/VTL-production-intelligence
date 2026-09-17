import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Quality from './pages/Quality';
import Sites from './pages/Sites';

export default function App() {
  const [assistantOpen, setAssistantOpen] = useState(true);

  return (
    <BrowserRouter>
      <Layout assistantOpen={assistantOpen} onToggleAssistant={() => setAssistantOpen(v => !v)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/production" element={<Production />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}