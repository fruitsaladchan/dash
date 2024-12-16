import React from 'react';
import { FaNetworkWired, FaDoorOpen, FaHistory } from 'react-icons/fa';
import Header from './Header';

function Network({ stats, darkMode, sidebarCollapsed, setDarkMode }) {
  return (
    <div className={`network-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Header 
        title="Network" 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        stats={stats} 
      />

      <div className="network-grid">
        <div className="network-interfaces-section">
          <div className="section-header">
            <FaNetworkWired />
            <h2>Network Interfaces</h2>
          </div>
          <div className="interfaces-grid">
            {stats.system_info.network_interfaces.map((netInterface, index) => (
              <div key={index} className="interface-card">
                <div className="interface-header">
                  <span className="interface-name">{netInterface.name}</span>
                  <span className={`interface-status ${netInterface.ip !== 'N/A' ? 'active' : 'inactive'}`}>
                    {netInterface.ip !== 'N/A' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="interface-details">
                  <div className="interface-detail">
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{netInterface.ip}</span>
                  </div>
                  <div className="interface-detail">
                    <span className="detail-label">MAC Address:</span>
                    <span className="detail-value">{netInterface.mac}</span>
                  </div>
                  <div className="interface-detail">
                    <span className="detail-label">Netmask:</span>
                    <span className="detail-value">{netInterface.netmask}</span>
                  </div>
                  <div className="interface-detail">
                    <span className="detail-label">Broadcast:</span>
                    <span className="detail-value">{netInterface.broadcast}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="open-ports-section">
          <div className="section-header">
            <FaDoorOpen />
            <h2>Open Ports</h2>
          </div>
          <div className="ports-table-container">
            <table className="ports-table">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>IP Address</th>
                  <th>Program</th>
                  <th>PID</th>
                </tr>
              </thead>
              <tbody>
                {stats.network.open_ports.map((port, index) => (
                  <tr key={index}>
                    <td>{port.port}</td>
                    <td>{port.ip}</td>
                    <td>{port.program}</td>
                    <td>{port.pid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="network-logs-section">
          <div className="section-header">
            <FaHistory />
            <h2>Network Logs</h2>
          </div>
          <div className="logs-container">
            {stats.network.logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Network; 