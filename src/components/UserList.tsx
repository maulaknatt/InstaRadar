import { useState, useMemo } from 'react';
import { Search, Star, ExternalLink, Download, Copy, Check, Info, ArrowUpDown } from 'lucide-react';
import type { InstagramUser } from '../utils/instagramParser';

interface UserListProps {
  users: InstagramUser[];
  title: string;
  listType: 'unfollowers' | 'fans' | 'mutuals';
  whitelist: string[];
  onToggleWhitelist: (username: string) => void;
}

export default function UserList({ users, title, listType, whitelist, onToggleWhitelist }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'username' | 'date'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hideWhitelisted, setHideWhitelisted] = useState(true);

  // Filter and sort users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u => u.username.toLowerCase().includes(q));
    }

    // 2. Apply Whitelist Filtering (only for unfollowers)
    if (listType === 'unfollowers' && hideWhitelisted) {
      result = result.filter(u => !whitelist.includes(u.username.toLowerCase()));
    }

    // 3. Apply Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'username') {
        comparison = a.username.localeCompare(b.username);
      } else if (sortBy === 'date') {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        comparison = timeA - timeB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, listType, whitelist, hideWhitelisted, sortBy, sortOrder]);

  const handleToggleSort = (field: 'username' | 'date') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCopyClipboard = () => {
    const listText = processedUsers.map(u => u.username).join('\n');
    navigator.clipboard.writeText(listText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Username,URL Profil,Tanggal Mengikuti"].join(",") + "\n"
      + processedUsers.map(u => `"${u.username}","${u.profileUrl}","${u.dateJoined || '-'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daftar_${listType}_instagram.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whitelistedCount = useMemo(() => {
    return users.filter(u => whitelist.includes(u.username.toLowerCase())).length;
  }, [users, whitelist]);

  return (
    <div className="user-list-section glass-card">
      <div className="section-header">
        <div className="header-info">
          <h2>{title}</h2>
          <span className="count-badge gradient-bg">
            {processedUsers.length} dari {users.length} akun
          </span>
        </div>
        
        <div className="header-actions">
          {processedUsers.length > 0 && (
            <>
              <button 
                className="btn btn-icon-text" 
                onClick={handleCopyClipboard}
                title="Salin daftar username ke clipboard"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
              <button 
                className="btn btn-icon-text" 
                onClick={handleExportCSV}
                title="Unduh daftar sebagai file CSV"
              >
                <Download size={16} />
                <span>Unduh CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <button 
            className={`btn btn-toggle ${sortBy === 'username' ? 'active' : ''}`}
            onClick={() => handleToggleSort('username')}
          >
            <ArrowUpDown size={14} />
            <span>Abjad ({sortOrder === 'asc' && sortBy === 'username' ? 'A-Z' : 'Z-A'})</span>
          </button>
          
          {users.some(u => u.timestamp) && (
            <button 
              className={`btn btn-toggle ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => handleToggleSort('date')}
            >
              <ArrowUpDown size={14} />
              <span>Tanggal ({sortOrder === 'asc' && sortBy === 'date' ? 'Lama' : 'Baru'})</span>
            </button>
          )}

          {listType === 'unfollowers' && whitelistedCount > 0 && (
            <label className="checkbox-label glass-card">
              <input 
                type="checkbox" 
                checked={hideWhitelisted} 
                onChange={(e) => setHideWhitelisted(e.target.checked)} 
              />
              <span>Sembunyikan Whitelist ({whitelistedCount})</span>
            </label>
          )}
        </div>
      </div>

      {listType === 'unfollowers' && (
        <div className="whitelist-tip">
          <Info size={14} className="text-pink-400" />
          <span>
            Bintang (<Star size={12} fill="currentColor" className="text-amber-400 inline" />) berguna untuk menandai akun selebriti/portal berita agar tidak mengacaukan daftar unfollower Anda.
          </span>
        </div>
      )}

      {/* USER LIST CONTAINER */}
      <div className="users-container">
        {processedUsers.length > 0 ? (
          <div className="users-grid">
            {processedUsers.map((user) => {
              const isWhitelisted = whitelist.includes(user.username.toLowerCase());
              return (
                <div key={user.username} className={`user-card glass-card ${isWhitelisted ? 'whitelisted' : ''}`}>
                  <div className="user-avatar gradient-avatar">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="user-details">
                    <span className="username" title={user.username}>@{user.username}</span>
                    {user.dateJoined && (
                      <span className="join-date">Diikuti: {user.dateJoined}</span>
                    )}
                  </div>

                  <div className="user-actions">
                    {listType === 'unfollowers' && (
                      <button 
                        className={`btn-star ${isWhitelisted ? 'active' : ''}`}
                        onClick={() => onToggleWhitelist(user.username)}
                        title={isWhitelisted ? 'Hapus dari Whitelist' : 'Tambahkan ke Whitelist'}
                      >
                        <Star size={16} fill={isWhitelisted ? 'currentColor' : 'none'} />
                      </button>
                    )}
                    
                    <a 
                      href={user.profileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-open-profile"
                      title="Buka profil di Instagram"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-results">
            <p>Tidak ada akun yang ditemukan.</p>
            {listType === 'unfollowers' && whitelistedCount > 0 && hideWhitelisted && (
              <button className="gradient-link mt-2" onClick={() => setHideWhitelisted(false)}>
                Tampilkan akun yang di-whitelist
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
