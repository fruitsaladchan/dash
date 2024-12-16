import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';
import { FaPowerOff, FaRedo, FaMoon, FaSnowflake, FaHome, FaServer, FaNetworkWired, FaChartLine, FaCog, FaTools, FaUserShield, FaGit, FaGithub } from 'react-icons/fa';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Network from './components/Network';
import Services from './components/Services';
import Accounts from './components/Accounts';
import Performance from './components/Performance';
import Logs from './components/Logs';
import Header from './components/Header';

function formatUptime(uptime) {
  const { days, hours, minutes, seconds } = uptime;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
  return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function getGreeting(hour) {
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 22) return "Good Evening";
  return "Good Night";
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const historyRef = useRef([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket('ws://localhost:8000/ws');

        wsRef.current.onopen = () => {
          console.log('WebSocket Connected');
          setConnectionStatus('connected');
          setError(null);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const newStats = JSON.parse(event.data);
            setStats(newStats);

            historyRef.current = [...historyRef.current, {
              timestamp: new Date(newStats.timestamp).toLocaleTimeString(),
              cpu: Array.isArray(newStats.cpu.percent) ? newStats.cpu.percent[0] : newStats.cpu.percent,
              memory: newStats.memory.percent,
              disk: newStats.disk.percent,
              upload_speed: newStats.network.upload_speed,
              download_speed: newStats.network.download_speed,
              disk_read_speed: newStats.disk.io?.read_speed || 0,
              disk_write_speed: newStats.disk.io?.write_speed || 0
            }].slice(-30);

            setHistory(historyRef.current);
          } catch (e) {
            console.error('Error processing message:', e);
            setError('Error processing server data');
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket Disconnected');
          setConnectionStatus('disconnected');
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket Error:', error);
          setError('Failed to connect to server');
          setConnectionStatus('error');
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to server');
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePowerAction = async (action) => {
    if (window.confirm(`Are you sure you want to ${action} the system?`)) {
      try {
        const response = await fetch(`http://localhost:8000/power/${action}`, {
          method: 'POST'
        });
        const data = await response.json();
        if (data.status === 'error') {
          alert(`Failed to ${action}: ${data.message}`);
        }
      } catch (error) {
        alert(`Failed to ${action}: ${error.message}`);
      }
    }
  };

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">
          Error: {error}
          <br />
          Please make sure the backend server is running on localhost:8000
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="loading-message">
          {connectionStatus === 'connecting' ? 'Connecting to server...' : 'Loading data...'}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <h2>Dashboard</h2>
          <nav className="nav-links">
            <Link to="/" className="nav-link">
              <FaHome />
              <span className="nav-text">Overview</span>
            </Link>
            <Link to="/network" className="nav-link">
              <FaNetworkWired />
              <span className="nav-text">Network</span>
            </Link>
            <Link to="/performance" className="nav-link">
              <FaChartLine />
              <span className="nav-text">Performance</span>
            </Link>
            {/* <Link to="/settings" className="nav-link"> */}
            {/*   <FaCog /> */}
            {/*   <span className="nav-text">Settings</span> */}
            {/* </Link> */}
            <Link to="/services" className="nav-link">
              <FaTools />
              <span className="nav-text">Services</span>
            </Link>
            <Link to="/logs" className="nav-link">
              <FaServer />
              <span className="nav-text">Logs</span>
            </Link>
            <Link to="/accounts" className="nav-link">
              <FaUserShield />
              <span className="nav-text">Accounts</span>
            </Link>
            <Link to="https://github.com/fruitsaladchan" className="nav-link" target="_blank">
              <FaGithub />
              <span className="nav-text">Source Code</span>
            </Link>
          </nav>
        </div>

        <Routes>
          <Route path="/" element={
            <div className={`dashboard ${sidebarCollapsed ? 'collapsed' : ''}`}>
              <Header
                title={`${getGreeting(new Date().getHours())}, ${stats.username}`}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                stats={stats}
              />

              <div className="system-info">
                <h2>System Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Hostname</label>
                    <span>{stats.hostname}</span>
                  </div>
                  <div className="info-item">
                    <label>System Type</label>
                    <span>{stats.system_info.type}</span>
                  </div>
                  <div className="info-item">
                    <label>Operating System</label>
                    <span>{stats.system_info.os.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Version</label>
                    <span>{stats.system_info.os.version}</span>
                  </div>
                  <div className="info-item">
                    <label>CPU Model</label>
                    <span>{stats.system_info.processor?.model}</span>
                  </div>
                  <div className="info-item">
                    <label>CPU Cores</label>
                    <span>{stats.system_info.processor?.cores} Cores</span>
                  </div>
                  <div className="info-item">
                    <label>Architecture</label>
                    <span>{stats.system_info.architecture}</span>
                  </div>
                  <div className="info-item">
                    <label>Uptime</label>
                    <span>{formatUptime(stats.uptime)}</span>
                  </div>
                  {stats.system_info.bios && (
                    <>
                      <div className="info-item">
                        <label>BIOS Vendor</label>
                        <span>{stats.system_info.bios.vendor}</span>
                      </div>
                      <div className="info-item">
                        <label>BIOS Version</label>
                        <span>{stats.system_info.bios.version}</span>
                      </div>
                      <div className="info-item">
                        <label>BIOS Date</label>
                        <span>{stats.system_info.bios.date}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* <div className="pci-devices-section"> */}
              {/*   <h2>PCI Devices</h2> */}
              {/*   <div className="table-container"> */}
              {/*     <table className="pci-table"> */}
              {/*       <thead> */}
              {/*         <tr> */}
              {/*           <th>Class</th> */}
              {/*           <th>Vendor</th> */}
              {/*           <th>Model</th> */}
              {/*         </tr> */}
              {/*       </thead> */}
              {/*       <tbody> */}
              {/*         {stats.pci_devices.map((device, index) => ( */}
              {/*           <tr key={index}> */}
              {/*             <td>{device.class}</td> */}
              {/*             <td>{device.vendor}</td> */}
              {/*             <td>{device.model}</td> */}
              {/*           </tr> */}
              {/*         ))} */}
              {/*       </tbody> */}
              {/*     </table> */}
              {/*   </div> */}
              {/* </div> */}

              <div className="controls-row">
                <div className="power-control">
                  <h2>Power Controls</h2>
                  <div className="power-buttons">
                    <button onClick={() => handlePowerAction('shutdown')} className="power-button shutdown">
                      <FaPowerOff />
                      <span>Shutdown</span>
                    </button>
                    <button onClick={() => handlePowerAction('restart')} className="power-button restart">
                      <FaRedo />
                      <span>Restart</span>
                    </button>
                    <button onClick={() => handlePowerAction('sleep')} className="power-button sleep">
                      <FaMoon />
                      <span>Sleep</span>
                    </button>
                    <button onClick={() => handlePowerAction('hibernate')} className="power-button hibernate">
                      <FaSnowflake />
                      <span>Hibernate</span>
                    </button>
                  </div>
                </div>

                {stats.fan_speeds.length > 0 && (
                  <div className="fan-speeds">
                    <h3>Fan Speeds</h3>
                    {stats.fan_speeds.map((fan, index) => (
                      <div key={index} className="fan-speed">
                        <span>{fan.label}: </span>
                        <span>{fan.speed} RPM</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pci-devices-section">
                <h2>PCI Devices</h2>
                <div className="table-container">
                  <table className="pci-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Vendor</th>
                        <th>Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pci_devices.map((device, index) => (
                        <tr key={index}>
                          <td>{device.class}</td>
                          <td>{device.vendor}</td>
                          <td>{device.model}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          } />
          <Route path="/performance" element={
            <Performance
              stats={stats}
              history={history}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarCollapsed={sidebarCollapsed}
            />
          } />
          <Route path="/network" element={
            <Network
              stats={stats}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarCollapsed={sidebarCollapsed}
            />
          } />
          <Route path="/services" element={
            <Services
              stats={stats}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarCollapsed={sidebarCollapsed}
            />
          } />
          <Route path="/accounts" element={
            <Accounts
              stats={stats}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarCollapsed={sidebarCollapsed}
            />
          } />
          <Route path="/logs" element={
            <Logs
              stats={stats}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarCollapsed={sidebarCollapsed}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
