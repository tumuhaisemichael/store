"use client";

import { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  LayoutDashboard,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Download,
  Maximize2,
  X,
  Upload,
  Play,
  FileText,
  FolderPlus,
  Folder,
  ChevronRight,
  Menu,
  MoreVertical,
  ArrowLeft
} from "lucide-react";

interface MediaItem {
  id: string | number;
  type: "image" | "video" | "document";
  url: string;
  name: string;
  folder_id?: number | null;
}

interface FolderItem {
  id: number;
  name: string;
  created_at: string;
}

interface UploadProgress {
  id: string;
  name: string;
  type: string;
  progress: number;
  status: "uploading" | "done" | "error";
  previewUrl?: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [dbStatus, setDbStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos" | "documents">("all");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Admin" && password === "password") {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const fetchData = async () => {
    try {
      const initRes = await fetch('/api/init-db');
      await initRes.json();

      const [mediaRes, folderRes] = await Promise.all([
        fetch('/api/media'),
        fetch('/api/folders')
      ]);

      const mediaData = await mediaRes.json();
      const folderData = await folderRes.json();

      setMedia(Array.isArray(mediaData) ? mediaData : []);
      setFolders(Array.isArray(folderData) ? folderData : []);
      setDbStatus("online");
    } catch {
      setDbStatus("offline");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      });
      const data = await res.json();
      if (data.success) {
        setFolders(prev => [...prev, { id: data.id, name: data.name, created_at: new Date().toISOString() }]);
        setNewFolderName("");
        setIsCreatingFolder(false);
      }
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleUpload = (files: FileList | null, type: string) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const previewUrl = type !== 'document' ? URL.createObjectURL(file) : undefined;

      // Show in gallery temporarily
      const newItem: MediaItem = {
        id: tempId,
        type: type as any,
        url: previewUrl || "",
        name: file.name,
        folder_id: currentFolderId
      };
      setMedia(prev => [newItem, ...prev]);

      setUploads(prev => [...prev, {
        id: tempId, name: file.name, type, progress: 0, status: "uploading", previewUrl
      }]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (currentFolderId) formData.append('folder_id', currentFolderId.toString());

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: percent } : u));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setMedia(prev => prev.map(item =>
            item.id === tempId ? { ...item, id: result.id, url: result.url } : item
          ));
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: 100, status: "done" } : u));
          setTimeout(() => setUploads(prev => prev.filter(u => u.id !== tempId)), 3000);
        } else {
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error" } : u));
        }
      });

      xhr.addEventListener('error', () => {
        setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error" } : u));
      });

      xhr.open('POST', '/api/media');
      xhr.send(formData);
    });
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="bg-mesh"></div>
        <form className="login-card glass animate-in" onSubmit={handleLogin}>
          <div style={{ background: 'var(--secondary)', width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cloud size={32} color="white" />
          </div>
          <h2>CloudVault</h2>
          <p style={{ color: 'var(--text-dim)' }}>Secure Admin Access</p>
          <div className="input-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Username</label>
            <input type="text" className="input-field" placeholder="Admin" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {loginError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '1rem' }}>{loginError}</p>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    );
  }

  const currentFolderName = currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : null;

  const filteredMedia = media.filter(m => {
    // Inside a folder? Only show files of that folder
    if (currentFolderId && m.folder_id !== currentFolderId) return false;
    // On root? Only show files with no folder_id
    if (!currentFolderId && m.folder_id) return false;

    if (activeTab === "all") return true;
    if (activeTab === "images") return m.type === "image";
    if (activeTab === "videos") return m.type === "video";
    if (activeTab === "documents") return m.type === "document";
    return true;
  });

  return (
    <div className="dashboard-layout">
      <div className="bg-mesh"></div>

      {/* Mobile Header */}
      <div className="mobile-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cloud size={24} color="var(--accent)" />
          <span style={{ fontWeight: 800 }}>CloudVault</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="action-btn">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar glass ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
          <Cloud color="var(--accent)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CloudVault</h2>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <div className="nav-group">
            <p className="nav-label">Library</p>
            <div className={`nav-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => { setActiveTab("all"); setCurrentFolderId(null); setIsMobileMenuOpen(false); }}>
              <LayoutDashboard size={18} /> Dashboard
            </div>
            <div className={`nav-item ${activeTab === 'images' ? 'active' : ''}`} onClick={() => { setActiveTab("images"); setIsMobileMenuOpen(false); }}>
              <ImageIcon size={18} /> Images
            </div>
            <div className={`nav-item ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => { setActiveTab("videos"); setIsMobileMenuOpen(false); }}>
              <VideoIcon size={18} /> Videos
            </div>
            <div className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => { setActiveTab("documents"); setIsMobileMenuOpen(false); }}>
              <FileText size={18} /> Documents
            </div>
          </div>

          <div className="nav-group" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <p className="nav-label">Folders</p>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="action-btn-small"
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} style={{ margin: '0 0 1rem' }}>
                <input
                  autoFocus
                  className="input-field-small"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                />
              </form>
            )}

            {folders.map(folder => (
              <div
                key={folder.id}
                className={`nav-item ${currentFolderId === folder.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentFolderId(folder.id);
                  setActiveTab("all");
                  setIsMobileMenuOpen(false);
                }}
              >
                <Folder size={18} /> {folder.name}
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {uploads.length > 0 && (
            <div className="upload-stack glass">
              {uploads.map(u => (
                <div key={u.id} className="upload-status-item">
                  <div className="upload-info">
                    <span className="file-name">{u.name}</span>
                    <span className={`status-text ${u.status}`}>
                      {u.status === 'error' ? 'Failed' : u.status === 'done' ? 'Ready' : `${u.progress}%`}
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className={`progress-bar-fill ${u.status}`} style={{ width: `${u.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="db-status-badge">
            <div className={`status-dot ${dbStatus}`} />
            <span>{dbStatus === 'online' ? "DB Online" : "Connection Error"}</span>
          </div>

          <div className="nav-item logout" onClick={() => setIsLoggedIn(false)}>
            <LogOut size={18} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => setCurrentFolderId(null)}>Cloud</span>
            {currentFolderName && (
              <>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
                <span className="breadcrumb-item active">{currentFolderName}</span>
              </>
            )}
          </div>
          <div className="header-actions">
            <p className="file-count">{filteredMedia.length} files</p>
          </div>
        </header>

        {/* Upload Action Grid - ONLY at Root or specific folder view UI */}
        <div className="upload-grid">
          <div className="dropzone-mini glass" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon size={24} />
            <span>Upload Images</span>
            <input type="file" ref={imageInputRef} hidden accept="image/*" multiple onChange={(e) => handleUpload(e.target.files, "image")} />
          </div>
          <div className="dropzone-mini glass" onClick={() => videoInputRef.current?.click()}>
            <VideoIcon size={24} />
            <span>Upload Videos</span>
            <input type="file" ref={videoInputRef} hidden accept="video/*" multiple onChange={(e) => handleUpload(e.target.files, "video")} />
          </div>
          <div className="dropzone-mini glass" onClick={() => docInputRef.current?.click()}>
            <FileText size={24} />
            <span>Upload Documents</span>
            <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" multiple onChange={(e) => handleUpload(e.target.files, "document")} />
          </div>
        </div>

        {/* Content Explorer */}
        <div className="media-grid">
          {/* Folders in main view (if at root) */}
          {!currentFolderId && activeTab === 'all' && folders.map(folder => (
            <div key={folder.id} className="folder-card glass animate-in" onClick={() => setCurrentFolderId(folder.id)}>
              <div className="folder-icon-wrapper">
                <Folder size={40} fill="var(--accent)" color="var(--accent)" opacity={0.3} />
              </div>
              <div className="item-meta">
                <p className="item-name">{folder.name}</p>
                <p className="item-type">Folder</p>
              </div>
            </div>
          ))}

          {/* Files */}
          {filteredMedia.map((item) => (
            <div key={item.id} className="media-item glass animate-in" onClick={() => setSelectedMedia(item)}>
              <div className="item-preview">
                {item.type === "image" ? (
                  <img src={item.url} alt={item.name} loading="lazy" />
                ) : item.type === "video" ? (
                  <div className="video-thumb">
                    <video src={item.url} muted />
                    <div className="play-overlay">
                      <Play size={20} fill="white" color="white" />
                    </div>
                  </div>
                ) : (
                  <div className="doc-preview">
                    <FileText size={48} color="rgba(255,255,255,0.2)" />
                  </div>
                )}
              </div>

              <div className="media-overlay">
                <div className="media-actions">
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); downloadFile(item.url, item.name); }}>
                    <Download size={14} />
                  </button>
                </div>
                <div className="item-meta">
                  <p className="item-name">{item.name}</p>
                  <p className="item-type">{item.type.toUpperCase()}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredMedia.length === 0 && (!currentFolderId && folders.length === 0) && (
            <div className="empty-state">
              <Upload size={48} />
              <p>Your vault is empty. Start by uploading files or creating a folder.</p>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMedia(null)}>
              <X size={20} />
            </button>

            <div className="modal-body">
              {selectedMedia.type === "image" ? (
                <img src={selectedMedia.url} alt={selectedMedia.name} />
              ) : selectedMedia.type === "video" ? (
                <video src={selectedMedia.url} controls autoPlay />
              ) : (
                <div className="doc-modal-preview">
                  <FileText size={80} color="var(--accent)" />
                  <h3>{selectedMedia.name}</h3>
                  <p>Generic document preview is not available in browser. Use download to view.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-info">
                <p className="modal-title">{selectedMedia.name}</p>
                <p className="modal-subtitle">{selectedMedia.type.toUpperCase()}</p>
              </div>
              <button className="login-btn compact" onClick={() => downloadFile(selectedMedia.url, selectedMedia.name)}>
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .sidebar {
          transition: transform 0.3s ease;
          z-index: 100;
        }
        
        @media (max-width: 900px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
            padding-top: 64px;
          }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            transform: translateX(-100%);
            border-radius: 0;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .main-content {
            padding: 1.5rem;
          }
          .upload-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          z-index: 200;
          border-radius: 0;
          border-top: none;
          border-left: none;
          border-right: none;
        }

        @media (max-width: 900px) {
          .mobile-header {
            display: flex;
          }
        }

        .nav-group {
          padding: 0 0.5rem;
        }
        .nav-label {
          font-size: 0.7rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          padding-left: 0.5rem;
        }
        .action-btn-small {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: var(--text-dim);
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-small:hover {
          color: var(--accent);
          background: var(--glass-hover);
        }
        .input-field-small {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          outline: none;
        }
        .input-field-small:focus {
          border-color: var(--accent);
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .breadcrumb-item {
          font-weight: 600;
          cursor: pointer;
          font-size: 1.1rem;
          color: var(--text-dim);
        }
        .breadcrumb-item:hover {
          color: white;
        }
        .breadcrumb-item.active {
          color: white;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .dropzone-mini {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px dashed var(--border);
          text-align: center;
        }
        .dropzone-mini:hover {
          border-color: var(--accent);
          background: var(--glass-hover);
          transform: translateY(-2px);
        }
        .dropzone-mini span {
          font-size: 0.8rem;
          font-weight: 600;
        }
        .dropzone-mini svg {
          color: var(--accent);
        }

        .folder-card {
           padding: 1.5rem;
           display: flex;
           flex-direction: column;
           gap: 1rem;
           cursor: pointer;
           transition: all 0.2s;
        }
        .folder-card:hover {
          background: var(--glass-hover);
          transform: translateY(-4px);
        }
        .folder-icon-wrapper {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
        }

        .item-preview {
          height: 160px;
          overflow: hidden;
          background: #0a0a0a;
          position: relative;
        }
        .video-thumb video {
           width: 100%;
           height: 100%;
           object-fit: cover;
           opacity: 0.6;
        }
        .play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .doc-preview {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-meta {
          padding: 1rem;
        }
        .item-name {
          font-weight: 600;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-type {
          font-size: 0.7rem;
          color: var(--text-dim);
          margin-top: 2px;
        }

        .empty-state {
          grid-column: 1/-1;
          text-align: center;
          padding: 6rem 2rem;
          color: var(--text-dim);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .empty-state svg {
          opacity: 0.2;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .db-status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-dim);
          padding: 0.5rem;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--error);
        }
        .status-dot.online { background: var(--success); }
        
        .nav-item.logout {
          color: var(--error);
          opacity: 0.8;
        }
        .nav-item.logout:hover {
          background: rgba(255, 75, 75, 0.1);
          opacity: 1;
        }

        .upload-stack {
          padding: 1rem;
        }
        .upload-status-item {
          margin-bottom: 0.75rem;
        }
        .upload-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          margin-bottom: 4px;
        }
        .file-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status-text.done { color: var(--success); }
        .status-text.error { color: var(--error); }
        .progress-bar-bg {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s;
        }
        .progress-bar-fill.done { background: var(--success); }
        .progress-bar-fill.error { background: var(--error); }

        .doc-modal-preview {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          background: #050505;
        }
        .modal-body {
          background: black;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-body img, .modal-body video {
          max-height: 70vh;
          max-width: 100%;
        }
        .modal-footer {
          padding: 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--panel);
        }
        .modal-title { font-weight: 700; font-size: 1rem; }
        .modal-subtitle { font-size: 0.75rem; color: var(--text-dim); }
        .login-btn.compact { margin: 0; width: auto; padding: 8px 16px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          background: rgba(0,0,0,0.5);
          border: 1px solid var(--border);
          color: white;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
