import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { socket } from './services/api';

// Import components
import TeacherDashboard from './components/TeacherDashboard';
import LivePolling from './components/LivePolling';
import PBLWorkspace from './components/PBLWorkspace';
import SoftSkillsRubric from './components/SoftSkillsRubric';
import TemplateLibrary from './components/TemplateLibrary';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to AMEP server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      {/* Navigation */}
      <nav className="navbar">
        <h2>AMEP Platform</h2>

        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/polling">Live Polling</Link></li>
          <li><Link to="/projects">Projects</Link></li>
          <li><Link to="/soft-skills">Soft Skills</Link></li>
          <li><Link to="/templates">Templates</Link></li>
        </ul>

        <span className="connection-status">
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/polling" element={<LivePolling />} />
        <Route path="/projects" element={<PBLWorkspace />} />
        <Route path="/soft-skills" element={<SoftSkillsRubric />} />
        <Route path="/templates" element={<TemplateLibrary />} />
      </Routes>
    </Router>
  );
}

export default App;
