import { useState, useRef } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Trash2 } from 'lucide-react';
import { parseInstagramJSON } from '../utils/instagramParser';
import type { InstagramUser } from '../utils/instagramParser';

interface FileUploaderProps {
  onDataParsed: (followers: InstagramUser[], following: InstagramUser[]) => void;
}

export default function FileUploader({ onDataParsed }: FileUploaderProps) {
  const [followersList, setFollowersList] = useState<InstagramUser[]>([]);
  const [followingList, setFollowingList] = useState<InstagramUser[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{
    followers: string[];
    following: string | null;
  }>({ followers: [], following: null });

  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<'followers' | 'following' | null>(null);

  const followersInputRef = useRef<HTMLInputElement>(null);
  const followingInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = (file: File, type: 'followers' | 'following') => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseInstagramJSON(content, type);

      if (result.success && result.users) {
        if (type === 'followers') {
          // Merge unique users if multiple followers files are uploaded
          setFollowersList(prev => {
            const merged = [...prev, ...result.users];
            const seen = new Set<string>();
            const unique = merged.filter(u => {
              const lower = u.username.toLowerCase();
              if (seen.has(lower)) return false;
              seen.add(lower);
              return true;
            });
            
            // Check if following is also uploaded, trigger callback
            if (followingList.length > 0) {
              onDataParsed(unique, followingList);
            }
            return unique;
          });

          setUploadedFiles(prev => ({
            ...prev,
            followers: [...prev.followers, file.name]
          }));
        } else {
          setFollowingList(result.users);
          setUploadedFiles(prev => ({
            ...prev,
            following: file.name
          }));

          // Trigger callback if followers is already uploaded
          if (followersList.length > 0) {
            onDataParsed(followersList, result.users);
          }
        }
      } else {
        setError(result.error || 'Terjadi kesalahan saat memproses file.');
      }
    };
    reader.onerror = () => {
      setError(`Gagal membaca file ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent, type: 'followers' | 'following') => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'followers' | 'following') => {
    e.preventDefault();
    setIsDragging(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === 'followers') {
        // Handle multiple followers files
        Array.from(files).forEach(file => {
          if (file.name.endsWith('.json')) {
            handleFileRead(file, 'followers');
          } else {
            setError('Ekstensi file harus berupa .json');
          }
        });
      } else {
        // Only take the first file for following
        const file = files[0];
        if (file.name.endsWith('.json')) {
          handleFileRead(file, 'following');
        } else {
          setError('Ekstensi file harus berupa .json');
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'followers' | 'following') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (type === 'followers') {
        Array.from(files).forEach(file => handleFileRead(file, 'followers'));
      } else {
        handleFileRead(files[0], 'following');
      }
    }
  };

  const handleReset = () => {
    setFollowersList([]);
    setFollowingList([]);
    setUploadedFiles({ followers: [], following: null });
    setError(null);
    // Notify parent with empty arrays
    onDataParsed([], []);
    if (followersInputRef.current) followersInputRef.current.value = '';
    if (followingInputRef.current) followingInputRef.current.value = '';
  };

  const hasFollowers = followersList.length > 0;
  const hasFollowing = followingList.length > 0;

  return (
    <div className="uploader-wrapper">
      <div className="uploader-grids">
        
        {/* followers DROPZONE */}
        <div 
          className={`dropzone glass-card ${isDragging === 'followers' ? 'dragging' : ''} ${hasFollowers ? 'completed' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'followers')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'followers')}
          onClick={() => followersInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={followersInputRef}
            onChange={(e) => handleFileChange(e, 'followers')}
            accept=".json"
            multiple
            style={{ display: 'none' }}
          />
          
          <div className="dropzone-content">
            {hasFollowers ? (
              <>
                <div className="success-icon-wrapper">
                  <FileCheck size={40} className="text-emerald-400 drop-shadow-glow" />
                </div>
                <h3>Followers Berhasil Dimuat</h3>
                <p className="file-info text-emerald-300">
                  {followersList.length.toLocaleString('id-ID')} pengikut terdeteksi
                </p>
                <div className="file-tags">
                  {uploadedFiles.followers.map((name, i) => (
                    <span key={i} className="file-tag">{name}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="upload-icon-wrapper text-pink-500 animate-bounce-slow">
                  <UploadCloud size={40} />
                </div>
                <h3>Upload file Pengikut</h3>
                <p>Klik atau Seret file <strong>followers_1.json</strong> ke sini</p>
                <span className="file-hint">Mendukung multiple files jika followers &gt; 10k</span>
              </>
            )}
          </div>
        </div>

        {/* following DROPZONE */}
        <div 
          className={`dropzone glass-card ${isDragging === 'following' ? 'dragging' : ''} ${hasFollowing ? 'completed' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'following')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'following')}
          onClick={() => followingInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={followingInputRef}
            onChange={(e) => handleFileChange(e, 'following')}
            accept=".json"
            style={{ display: 'none' }}
          />
          
          <div className="dropzone-content">
            {hasFollowing ? (
              <>
                <div className="success-icon-wrapper">
                  <FileCheck size={40} className="text-purple-400 drop-shadow-glow" />
                </div>
                <h3>Following Berhasil Dimuat</h3>
                <p className="file-info text-purple-300">
                  {followingList.length.toLocaleString('id-ID')} akun diikuti terdeteksi
                </p>
                <span className="file-tag">{uploadedFiles.following}</span>
              </>
            ) : (
              <>
                <div className="upload-icon-wrapper text-purple-500 animate-bounce-slow">
                  <UploadCloud size={40} />
                </div>
                <h3>Upload file Diikuti</h3>
                <p>Klik atau Seret file <strong>following.json</strong> ke sini</p>
                <span className="file-hint">Diunduh dari folder followers_and_following</span>
              </>
            )}
          </div>
        </div>

      </div>

      {error && (
        <div className="upload-error glass-card">
          <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      {(hasFollowers || hasFollowing) && (
        <div className="uploader-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleReset}
            title="Reset semua file dan mulai dari awal"
          >
            <Trash2 size={16} />
            <span>Hapus & Mulai Ulang</span>
          </button>
        </div>
      )}
    </div>
  );
}
