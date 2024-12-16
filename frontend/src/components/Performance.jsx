import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes, formatSpeed } from '../utils/formatters';
import Header from './Header';

function Performance({ stats, history, darkMode, sidebarCollapsed, setDarkMode }) {
  const [processCount, setProcessCount] = useState(10);

  return (
    <div className={`performance-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Header 
        title="Performance" 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        stats={stats} 
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cpu">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="stat-content">
            <h3>CPU Usage</h3>
            <div className="stat-value">
              {typeof stats.cpu.percent === 'number' ? `${stats.cpu.percent.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.cpu.percent}%` }}
              />
            </div>
            {stats.cpu.temperature && (
              <div className="stat-detail">Temperature: {stats.cpu.temperature}°C</div>
            )}
            <div className="stat-detail">
              Frequency: {(stats.cpu.frequency.current / 1000).toFixed(2)} GHz
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon memory">
            <i className="fas fa-memory"></i>
          </div>
          <div className="stat-content">
            <h3>Memory Usage</h3>
            <div className="stat-value">{stats.memory.percent}%</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.memory.percent}%` }}
              />
            </div>
            <div className="stat-detail">
              {formatBytes(stats.memory.available)} free of {formatBytes(stats.memory.total)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon disk">
            <i className="fas fa-hdd"></i>
          </div>
          <div className="stat-content">
            <h3>Disk Usage</h3>
            <div className="stat-value">{stats.disk.percent}%</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.disk.percent}%` }}
              />
            </div>
            <div className="stat-detail">
              {formatBytes(stats.disk.free)} free of {formatBytes(stats.disk.total)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon network-up">
            <i className="fas fa-upload"></i>
          </div>
          <div className="stat-content">
            <h3>Upload Speed</h3>
            <div className="stat-value">
              {formatSpeed(stats.network.upload_speed)}
            </div>
            <div className="stat-detail">
              Total: {formatBytes(stats.network.bytes_sent)}
            </div>
            <div className="stat-detail">
              Packets: {stats.network.packets_sent.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon network-down">
            <i className="fas fa-download"></i>
          </div>
          <div className="stat-content">
            <h3>Download Speed</h3>
            <div className="stat-value">
              {formatSpeed(stats.network.download_speed)}
            </div>
            <div className="stat-detail">
              Total: {formatBytes(stats.network.bytes_recv)}
            </div>
            <div className="stat-detail">
              Packets: {stats.network.packets_recv.toLocaleString()}
            </div>
          </div>
        </div>

        {stats.battery && (
          <div className="stat-card">
            <div className="stat-icon battery">
              <i className={`fas ${stats.battery.power_plugged ? 'fa-plug' : 'fa-battery-three-quarters'}`}></i>
            </div>
            <div className="stat-content">
              <h3>Battery</h3>
              <div className="stat-value">
                {stats.battery.percent.toFixed(1)}%
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ 
                    width: `${stats.battery.percent}%`,
                    background: stats.battery.percent > 20 ? undefined : '#f44336'
                  }}
                />
              </div>
              <div className="stat-detail">
                Status: {stats.battery.power_plugged ? 'Charging' : 'On Battery'}
              </div>
              {stats.battery.seconds_left && !stats.battery.power_plugged && (
                <div className="stat-detail">
                  Time remaining: {Math.floor(stats.battery.seconds_left / 60)} min
                </div>
              )}
            </div>
          </div>
        )}
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

      <div className="charts-grid">
        <div className="chart">
          <h2>CPU Usage History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
              <XAxis
                dataKey="timestamp"
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <YAxis
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#333' : '#fff',
                  border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                  color: darkMode ? '#fff' : '#333'
                }}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#8884d8"
                name="CPU %"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h2>Memory Usage History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
              <XAxis
                dataKey="timestamp"
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <YAxis
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#333' : '#fff',
                  border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                  color: darkMode ? '#fff' : '#333'
                }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#82ca9d"
                name="Memory %"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h2>Disk Usage History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
              <XAxis
                dataKey="timestamp"
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <YAxis
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#333' : '#fff',
                  border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                  color: darkMode ? '#fff' : '#333'
                }}
              />
              <Line
                type="monotone"
                dataKey="disk"
                stroke="#ffc658"
                name="Disk %"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h2>Network Speed History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
              <XAxis
                dataKey="timestamp"
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <YAxis
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#333' : '#fff',
                  border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                  color: darkMode ? '#fff' : '#333'
                }}
                formatter={(value) => formatSpeed(value)}
              />
              <Line
                type="monotone"
                dataKey="upload_speed"
                stroke="#3949ab"
                name="Upload"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="download_speed"
                stroke="#8e24aa"
                name="Download"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h2>Disk I/O Speed</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
              <XAxis
                dataKey="timestamp"
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <YAxis
                stroke={darkMode ? '#888' : '#666'}
                tick={{ fill: darkMode ? '#888' : '#666' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#333' : '#fff',
                  border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                  color: darkMode ? '#fff' : '#333'
                }}
                formatter={(value) => formatSpeed(value)}
              />
              <Line
                type="monotone"
                dataKey="disk_read_speed"
                stroke="#00acc1"
                name="Read"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="disk_write_speed"
                stroke="#d81b60"
                name="Write"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="processes-section">
        <div className="processes-header">
          <h2>Top Processes</h2>
          <div className="process-count-selector">
            <label htmlFor="processCount">Show: </label>
            <select
              id="processCount"
              value={processCount}
              onChange={(e) => setProcessCount(Number(e.target.value))}
              className="process-count-select"
            >
              <option value="5">5 processes</option>
              <option value="10">10 processes</option>
              <option value="15">15 processes</option>
              <option value="20">20 processes</option>
            </select>
          </div>
        </div>
        <div className="processes-grid">
          <table className="processes-table">
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>CPU %</th>
                <th>Memory %</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_processes.slice(0, processCount).map((process) => (
                <tr key={process.pid}>
                  <td>{process.pid}</td>
                  <td>{process.name}</td>
                  <td>{process.cpu_percent?.toFixed(1)}%</td>
                  <td>{process.memory_percent?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Performance; 