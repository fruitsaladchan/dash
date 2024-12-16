import React from 'react';
import { FaUsers, FaUserCircle, FaUserFriends } from 'react-icons/fa';
import Header from './Header';

function Accounts({ stats, darkMode, sidebarCollapsed, setDarkMode }) {
  return (
    <div className={`accounts-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Header 
        title="Accounts" 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        stats={stats} 
      />

      <div className="accounts-grid">
        {/* active users */}
        <div className="active-users-section">
          <div className="section-header">
            <FaUsers />
            <h2>Active Users</h2>
          </div>
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Terminal</th>
                  <th>Host</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {stats.active_users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.name}</td>
                    <td>{user.terminal}</td>
                    <td>{user.host}</td>
                    <td>{user.started}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="system-users-section">
          <div className="section-header">
            <FaUserCircle />
            <h2>System Users</h2>
          </div>
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>UID</th>
                  <th>GID</th>
                  <th>Last Login</th>
                  <th>Home Directory</th>
                  <th>Shell</th>
                </tr>
              </thead>
              <tbody>
                {stats.accounts.users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.name}</td>
                    <td>{user.uid}</td>
                    <td>{user.gid}</td>
                    <td>{user.last_login}</td>
                    <td className="path-cell">{user.home}</td>
                    <td className="path-cell">{user.shell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="groups-section">
          <div className="section-header">
            <FaUserFriends />
            <h2>Groups</h2>
          </div>
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>GID</th>
                  <th>Members</th>
                </tr>
              </thead>
              <tbody>
                {stats.accounts.groups.map((group, index) => (
                  <tr key={index}>
                    <td>{group.name}</td>
                    <td>{group.gid}</td>
                    <td>{group.members.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Accounts; 
