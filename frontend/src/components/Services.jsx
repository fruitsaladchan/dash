import React, { useState } from 'react';
import { FaSearch, FaCircle } from 'react-icons/fa';
import Header from './Header';

function Services({ stats, darkMode, sidebarCollapsed, setDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = stats.services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate service statistics
  const totalServices = stats.services.length;
  const enabledServices = stats.services.filter(service => service.enabled).length;
  const disabledServices = totalServices - enabledServices;

  return (
    <div className={`services-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Header 
        title="Services" 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        stats={stats} 
      />

      <div className="services-container">
        <div className="services-summary">
          <div className="summary-item">
            <span className="summary-label">Total Services:</span>
            <span className="summary-value">{totalServices}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Enabled:</span>
            <span className="summary-value enabled">{enabledServices}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Disabled:</span>
            <span className="summary-value disabled">{disabledServices}</span>
          </div>
        </div>

        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="services-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>State</th>
                <th>Startup</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service, index) => (
                <tr key={index}>
                  <td>
                    <FaCircle className={`status-indicator ${
                      service.status.toLowerCase() === 'active' || 
                      service.status.toLowerCase() === 'running' ? 'active' : 'inactive'
                    }`} />
                  </td>
                  <td>{service.name}</td>
                  <td>{service.state}</td>
                  <td>
                    <span className={`startup-badge ${service.enabled ? 'enabled' : 'disabled'}`}>
                      {service.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Services; 