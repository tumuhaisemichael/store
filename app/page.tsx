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
  Play
} from "lucide-react";

interface MediaItem {
  id: string | number;
  type: "image" | "video";
  url: string;
  name: string;
}

interface UploadProgress {
  id: string;
  name: string;
  type: "image" | "video";
  progress: number;
  status: "uploading" | "done" | "error";
  previewUrl: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dbStatus, setDbStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos">("all");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Admin" && password === "password") {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      const initApp = async () => {
        try {
          const initRes = await fetch('/api/init-db');
          const initData = await initRes.json();
          if (!initData.success) throw new Error();
          const mediaRes = await fetch('/api/media');
          const mediaData = await mediaRes.json();
          // Guard: only set media if the response is a valid array
          setMedia(Array.isArray(mediaData) ? mediaData : []);
          setDbStatus("online");
        } catch {
          setDbStatus("offline");
          setMedia([
            { id: 1, type: "image", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", name: "Abstract Concept (Demo)" },
            { id: 2, type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-art-motion-on-a-black-background-43402-large.mp4", name: "Dynamic Flow (Demo)" }
          ]);
        }
      };
      initApp();
    }
  }, [isLoggedIn]);

  const handleUpload = (files: FileList | null, type: "image" | "video") => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      // Create a blob URL — works immediately in the browser, no server needed
      const previewUrl = URL.createObjectURL(file);

      // Show in gallery IMMEDIATELY using the blob URL
      setMedia(prev => [{ id: tempId, type, url: previewUrl, name: file.name }, ...prev]);

      // Track upload progress in the sidebar
      setUploads(prev => [...prev, {
        id: tempId, name: file.name, type, progress: 0, status: "uploading", previewUrl
      }]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: percent } : u));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            // KEY FIX: Update the id for lookup, but KEEP the blob URL so the image stays visible
            // The server URL will be used on next page load (after refresh)
            setMedia(prev => prev.map(item =>
              item.id === tempId
                ? { id: result.id, type, url: previewUrl, name: file.name }
                : item
            ));
            setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: 100, status: "done" } : u));
            setTimeout(() => setUploads(prev => prev.filter(u => u.id !== tempId)), 3000);
          } catch {
            setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error" } : u));
          }
        } else {
          // Even on error, keep the preview visible — just mark as error
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error" } : u));
          console.error("Upload failed:", xhr.status, xhr.responseText);
        }
      });

      xhr.addEventListener('error', () => {
        setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error" } : u));
        // Blob URL preview stays — network error doesn't clear the gallery item
        console.error("Network error during upload");
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

  const filteredMedia = activeTab === "all" ? media
    : media.filter(m => m.type === (activeTab === "images" ? "image" : "video"));

  return (
    <div className="dashboard-layout">
      <div className="bg-mesh"></div>

      {/* Sidebar */}
      <aside className="sidebar glass" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
          <Cloud color="var(--accent)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CloudVault</h2>
        </div>

        <div className={`nav-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab("all")}>
          <LayoutDashboard size={20} /> Dashboard
        </div>
        <div className={`nav-item ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab("images")}>
          <ImageIcon size={20} /> Images
        </div>
        <div className={`nav-item ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab("videos")}>
          <VideoIcon size={20} /> Videos
        </div>

        <div style={{ marginTop: 'auto' }}>
          {/* Upload Progress Panel */}
          {uploads.length > 0 && (
            <div className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Uploading</p>
              {uploads.map(u => (
                <div key={u.id} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{u.name}</span>
                    <span style={{ color: u.status === 'error' ? 'var(--error)' : u.status === 'done' ? 'var(--success)' : 'var(--accent)' }}>
                      {u.status === 'error' ? '✗' : u.status === 'done' ? '✓' : `${u.progress}%`}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${u.progress}%`,
                      background: u.status === 'error' ? 'var(--error)' : u.status === 'done' ? 'var(--success)' : 'linear-gradient(90deg, var(--secondary), var(--accent))',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginBottom: '8px' }}>
              {dbStatus === 'online'
                ? <CheckCircle2 size={14} color="var(--success)" />
                : <AlertCircle size={14} color="var(--error)" />}
              {dbStatus === 'online' ? "DB Systems Online" : "DB Connection Error"}
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/init-db');
                const data = await res.json();
                if (data.success) alert("System Refreshed Successfully!");
                window.location.reload();
              }}
              style={{ width: '100%', padding: '6px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
            >
              Sync & Repair Database
            </button>
          </div>

          <div className="nav-item" onClick={() => setIsLoggedIn(false)} style={{ color: 'var(--error)' }}>
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="section-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Media Explorer</h1>
            <p style={{ color: 'var(--text-dim)' }}>{filteredMedia.length} files stored</p>
          </div>
        </header>

        {/* Upload Grid */}
        <div className="upload-grid">
          <div className="dropzone glass" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon size={32} color="var(--accent)" />
            <h3>Upload Images</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>PNG, JPG, WEBP</p>
            <input type="file" ref={imageInputRef} hidden accept="image/*" multiple
              onChange={(e) => handleUpload(e.target.files, "image")} />
          </div>

          <div className="dropzone glass" onClick={() => videoInputRef.current?.click()}>
            <VideoIcon size={32} color="var(--accent)" />
            <h3>Upload Videos</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>MP4, MOV, WebM — up to 2GB</p>
            <input type="file" ref={videoInputRef} hidden accept="video/*" multiple
              onChange={(e) => handleUpload(e.target.files, "video")} />
          </div>
        </div>

        {/* Media Grid */}
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <div key={item.id} className="media-item glass animate-in" onClick={() => setSelectedMedia(item)}>
              {item.type === "image" ? (
                <img src={item.url} alt={item.name} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                  {/* Basic Thumbnail Preview */}
                  <video src={item.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', opacity: 0.6 }} />
                  <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)' }}>
                    <Play size={24} fill="white" color="white" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              )}
              <div className="media-overlay">
                <div className="media-actions">
                  <button className="action-btn" title="Download" onClick={(e) => { e.stopPropagation(); downloadFile(item.url, item.name); }}>
                    <Download size={16} />
                  </button>
                  <button className="action-btn" title="Open Player" onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); }}>
                    <Maximize2 size={16} />
                  </button>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{item.type.toUpperCase()}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredMedia.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-dim)' }}>
              <Upload size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
              <p>No media in this category yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Full-Screen Preview / Video Player Modal */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: selectedMedia.type === 'video' ? '90vw' : 'auto', maxWidth: '1200px' }}>
            {/* Close button */}
            <button onClick={() => setSelectedMedia(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <X size={20} />
            </button>

            {selectedMedia.type === "image" ? (
              <img src={selectedMedia.url} alt={selectedMedia.name} style={{ maxHeight: '85vh', width: '100%', objectFit: 'contain', background: '#000' }} />
            ) : (
              /* Full-featured video player */
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                controlsList="nodownload"
                style={{
                  width: '100%',
                  maxHeight: '80vh',
                  background: '#000',
                  display: 'block',
                  outline: 'none'
                }}
              />
            )}

            <div style={{ padding: '1rem 1.5rem', background: 'rgba(10,10,10,0.95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMedia.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{selectedMedia.type.toUpperCase()}</p>
              </div>
              <button className="login-btn" style={{ width: 'auto', padding: '8px 20px', marginTop: 0, fontSize: '0.85rem', flexShrink: 0 }}
                onClick={() => downloadFile(selectedMedia.url, selectedMedia.name)}>
                <Download size={14} style={{ marginRight: '6px', display: 'inline' }} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
