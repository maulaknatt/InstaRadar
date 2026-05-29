import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldAlert, Download, Settings, FileJson, CheckCircle2, Smartphone, Globe } from 'lucide-react';

export default function Instructions() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(0);

  const steps = [
    {
      title: 'Buka Menu Unduh Data Meta',
      icon: <Settings className="step-icon text-pink-500" size={20} />,
      desc: 'Buka aplikasi Instagram di ponsel Anda, masuk ke **Profil** > ketuk ikon tiga baris di kanan atas > **Pusat Akun (Accounts Center)**. Atau buka langsung di browser via [accountscenter.instagram.com](https://accountscenter.instagram.com/).',
    },
    {
      title: 'Pilih "Unduh Informasi Anda"',
      icon: <Download className="step-icon text-purple-500" size={20} />,
      desc: 'Scroll ke bawah dan temukan menu **"Informasi dan izin Anda" (Your information and permissions)**, lalu klik **"Unduh informasi Anda" (Download your information)**.',
    },
    {
      title: 'Pilih Akun & Tentukan Data',
      icon: <HelpCircle className="step-icon text-indigo-500" size={20} />,
      desc: 'Klik **"Unduh atau transfer informasi"**, pilih akun Instagram Anda, lalu klik **"Sebagian informasi Anda" (Some of your information)**. Cari dan centang opsi **"Pengikut dan Mengikuti" (Followers and Following)** saja agar prosesnya cepat, kemudian klik **Berikutnya**.',
    },
    {
      title: 'Pilih Format JSON (Sangat Penting!)',
      icon: <FileJson className="step-icon text-pink-500" size={20} />,
      desc: 'Pada layar konfigurasi: \n- **Format:** Pilih **JSON** (Jangan pilih HTML, karena HTML tidak bisa dibaca mesin).\n- **Rentang Tanggal:** Pilih **"Sepanjang waktu" (All time)**.\n- Klik **"Buat File"** untuk mengirim permintaan.',
    },
    {
      title: 'Tunggu dan Unduh ZIP',
      icon: <CheckCircle2 className="step-icon text-emerald-500" size={20} />,
      desc: 'Meta membutuhkan waktu 5-30 menit untuk menyiapkan file Anda (Anda akan menerima email jika sudah siap). Setelah siap, kembali ke halaman yang sama untuk mengunduh file ZIP. Ekstrak ZIP tersebut, lalu Anda akan menemukan folder bernama `connections/followers_and_following/` berisi file `followers_1.json` dan `following.json`. Unggah kedua file tersebut di website ini!',
    }
  ];

  return (
    <div className="instructions-container glass-card">
      <button 
        className="instructions-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="trigger-title">
          <HelpCircle size={22} className="text-pink-400 animate-pulse-glow" />
          <span>Cara Mendapatkan File JSON Instagram Anda (100% Aman)</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="instructions-content">
          <div className="security-alert">
            <ShieldAlert className="alert-icon text-amber-400" size={24} />
            <div className="alert-text">
              <strong>Mengapa metode ini 100% aman?</strong> Kami tidak pernah meminta password Anda. File data Anda diproses 100% secara lokal di browser Anda sendiri. Tidak ada data yang dikirim ke internet atau server kami. Akun Anda sepenuhnya aman dari risiko banned.
            </div>
          </div>

          <div className="steps-list">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div 
                  key={idx} 
                  className={`step-item ${isActive ? 'active' : ''}`}
                >
                  <button 
                    className="step-header"
                    onClick={() => setActiveStep(isActive ? null : idx)}
                  >
                    <div className="step-title-group">
                      <span className="step-number">{idx + 1}</span>
                      {step.icon}
                      <span className="step-title">{step.title}</span>
                    </div>
                    {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isActive && (
                    <div className="step-body">
                      <p 
                        dangerouslySetInnerHTML={{ 
                          __html: step.desc
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="gradient-link">$1</a>')
                            .replace(/\n/g, '<br />')
                        }} 
                      />
                      {idx === 0 && (
                        <div className="step-action-buttons">
                          <a 
                            href="instagram://settings" 
                            className="btn btn-instagram-app btn-sm"
                          >
                            <Smartphone size={16} />
                            <span>Buka di Aplikasi Instagram (HP)</span>
                          </a>
                          <a 
                            href="https://accountscenter.instagram.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <Globe size={16} />
                            <span>Buka di Browser</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
