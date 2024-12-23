import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaClock } from 'react-icons/fa';
import Header from './Header';

function Logs({ stats, darkMode, sidebarCollapsed, setDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState('all');
  const [timeFilter, setTimeFilter] = useState('current-boot');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, priority, timeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const backendUrl = window.location.hostname;
      const response = await fetch(`http://${backendUrl}:8000/logs?priority=${priority}&time_filter=${timeFilter}&search=${searchTerm}`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    const classes = {
      '0': 'emergency',
      '1': 'alert',
      '2': 'critical',
      '3': 'error',
      '4': 'warning',
      '5': 'notice',
      '6': 'info',
      '7': 'debug'
    };
    return `priority-${classes[priority] || 'info'}`;
  };

  return (
    <div className={`logs-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Header 
        title="System Logs" 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        stats={stats} 
      />

      <div className="logs-controls">
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <FaFilter />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="priority-select"
            >
              {stats.log_priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FaClock />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="time-select"
            >
              <option value="current-boot">Current Boot</option>
              <option value="previous-boot">Previous Boot</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="logs-container">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="no-logs">No logs found</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${getPriorityClass(log.priority)}`}>
              <div className="log-header">
                <span className="log-timestamp">
                  {new Date(parseInt(log.timestamp) / 1000).toLocaleString()}
                </span>
                <span className="log-unit">{log.unit}</span>
              </div>
              <div className="log-message">{log.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Logs; 