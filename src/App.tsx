import { useState, useEffect, useMemo } from 'react';
import { Users, UserMinus, UserCheck, Heart } from 'lucide-react';
import FileUploader from './components/FileUploader';
import UserList from './components/UserList';
import Instructions from './components/Instructions';
import { compareInstagramLists } from './utils/instagramParser';
import type { InstagramUser, AnalysisResult } from './utils/instagramParser';

export default function App() {
  const [followers, setFollowers] = useState<InstagramUser[]>([]);
  const [following, setFollowing] = useState<InstagramUser[]>([]);
  const [activeTab, setActiveTab] = useState<'unfollowers' | 'fans' | 'mutuals'>('unfollowers');
  
  // Whitelist state loaded from localStorage
  const [whitelist, setWhitelist] = useState<string[]>(() => {
    const saved = localStorage.getItem('ig_unfoll_whitelist');
    return saved ? JSON.parse(saved) : [];
  });

  // Save whitelist to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ig_unfoll_whitelist', JSON.stringify(whitelist));
  }, [whitelist]);

  // Handle parsed data from uploader
  const handleDataParsed = (parsedFollowers: InstagramUser[], parsedFollowing: InstagramUser[]) => {
    setFollowers(parsedFollowers);
    setFollowing(parsedFollowing);
  };

  // Perform lists comparison
  const analysis: AnalysisResult | null = useMemo(() => {
    if (followers.length > 0 && following.length > 0) {
      return compareInstagramLists(followers, following);
    }
    return null;
  }, [followers, following]);

  const handleToggleWhitelist = (username: string) => {
    const userLower = username.toLowerCase();
    setWhitelist(prev => {
      if (prev.includes(userLower)) {
        return prev.filter(u => u !== userLower);
      } else {
        return [...prev, userLower];
      }
    });
  };

  // Calculate circular chart metrics
  const chartMetrics = useMemo(() => {
    if (!analysis) return { percentage: 0, label: '0%', ratioText: '0 / 0' };
    
    const totalFollowing = analysis.followingCount;
    if (totalFollowing === 0) return { percentage: 0, label: '0%', ratioText: '0 / 0' };

    // Ratio of people who don't follow back
    const unfollowerCount = analysis.unfollowers.length;
    const rawPercentage = (unfollowerCount / totalFollowing) * 100;
    const percentage = Math.round(rawPercentage);

    return {
      percentage,
      label: `${percentage}%`,
      ratioText: `${unfollowerCount.toLocaleString('id-ID')} dari ${totalFollowing.toLocaleString('id-ID')}`
    };
  }, [analysis]);

  const isDataLoaded = followers.length > 0 && following.length > 0;

  return (
    <div className="app-container">
      
      {/* HEADER SECTION */}
      <header className="app-header">
        <span className="app-badge animate-pulse-glow">Beta Version 1.0</span>
        <h1 className="gradient-text">InstaRadar</h1>
        <p>
          Cek siapa saja yang tidak mengikuti Anda kembali di Instagram dengan mudah, instan, 
          dan **100% aman** tanpa risiko banned akun.
        </p>
      </header>

      {/* STEP BY STEP MANUAL GUIDE */}
      <Instructions />

      {/* FILE UPLOADER */}
      <FileUploader onDataParsed={handleDataParsed} />

      {/* DASHBOARD ANALYTICS SECTION */}
      {isDataLoaded && analysis && (
        <div className="dashboard-container">
          
          <div className="analytics-overview">
            
            {/* SVG Circular Progress Card */}
            <div className="chart-card glass-card">
              <div className="circular-chart-wrapper">
                <svg className="circular-chart" viewBox="0 0 36 36">
                  {/* SVG gradients definition */}
                  <defs>
                    <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff007f" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  
                  <path 
                    className="circle-bg" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                  <path 
                    className="circle" 
                    strokeDasharray={`${chartMetrics.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                </svg>
                <div className="chart-center-text">
                  <span className="chart-percentage gradient-text">{chartMetrics.label}</span>
                  <span className="chart-label">Unfollower</span>
                </div>
              </div>

              <div className="chart-meta">
                <h3>Rasio Unfollow Anda</h3>
                <p>
                  Sebanyak {chartMetrics.ratioText} akun yang Anda ikuti tidak melakukan follow back.
                </p>
              </div>
            </div>

            {/* TAB SELECTOR CARDS */}
            <div className="stats-cards-grid">
              
              {/* Card Unfollowers */}
              <div 
                className={`stat-card glass-card ${activeTab === 'unfollowers' ? 'active' : ''}`}
                onClick={() => setActiveTab('unfollowers')}
              >
                <div className="stat-header">
                  <span>Tidak Follback</span>
                  <div className="stat-icon-box text-pink-500">
                    <UserMinus size={18} />
                  </div>
                </div>
                <div className="stat-number gradient-text">
                  {analysis.unfollowers.length.toLocaleString('id-ID')}
                </div>
                <div className="stat-footer">
                  Mereka tidak follow back Anda
                </div>
              </div>

              {/* Card Mutuals */}
              <div 
                className={`stat-card glass-card ${activeTab === 'mutuals' ? 'active' : ''}`}
                onClick={() => setActiveTab('mutuals')}
              >
                <div className="stat-header">
                  <span>Saling Mengikuti</span>
                  <div className="stat-icon-box text-purple-500">
                    <UserCheck size={18} />
                  </div>
                </div>
                <div className="stat-number">
                  {analysis.mutuals.length.toLocaleString('id-ID')}
                </div>
                <div className="stat-footer">
                  Saling follow satu sama lain
                </div>
              </div>

              {/* Card Fans */}
              <div 
                className={`stat-card glass-card ${activeTab === 'fans' ? 'active' : ''}`}
                onClick={() => setActiveTab('fans')}
              >
                <div className="stat-header">
                  <span>Fans Anda</span>
                  <div className="stat-icon-box text-emerald-500">
                    <Heart size={18} />
                  </div>
                </div>
                <div className="stat-number">
                  {analysis.fans.length.toLocaleString('id-ID')}
                </div>
                <div className="stat-footer">
                  Mereka follow tapi tidak Anda follow
                </div>
              </div>

              {/* Total Followers Overview */}
              <div className="stat-card glass-card" style={{ cursor: 'default' }}>
                <div className="stat-header">
                  <span>Total Ringkasan</span>
                  <div className="stat-icon-box text-indigo-500">
                    <Users size={18} />
                  </div>
                </div>
                <div className="stat-footer" style={{ marginTop: '5px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div>👥 Pengikut: <strong>{analysis.followersCount.toLocaleString('id-ID')}</strong></div>
                  <div>👉 Mengikuti: <strong>{analysis.followingCount.toLocaleString('id-ID')}</strong></div>
                </div>
              </div>

            </div>

          </div>

          {/* ACTIVE USER LIST DISPLAY */}
          {activeTab === 'unfollowers' && (
            <UserList 
              users={analysis.unfollowers}
              title="Akun Yang Tidak Mengikuti Anda Kembali"
              listType="unfollowers"
              whitelist={whitelist}
              onToggleWhitelist={handleToggleWhitelist}
            />
          )}

          {activeTab === 'mutuals' && (
            <UserList 
              users={analysis.mutuals}
              title="Teman Saling Mengikuti (Mutuals)"
              listType="mutuals"
              whitelist={whitelist}
              onToggleWhitelist={handleToggleWhitelist}
            />
          )}

          {activeTab === 'fans' && (
            <UserList 
              users={analysis.fans}
              title="Pengikut Yang Tidak Anda Ikuti Kembali (Fans)"
              listType="fans"
              whitelist={whitelist}
              onToggleWhitelist={handleToggleWhitelist}
            />
          )}

        </div>
      )}

    </div>
  );
}
