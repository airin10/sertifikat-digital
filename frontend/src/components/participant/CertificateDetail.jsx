import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { participantApi } from '../../services/api';
import { 
  ArrowLeft, Download, FileText, CheckCircle, XCircle, 
  Calendar, Building, User, Hash, QrCode 
} from 'lucide-react';

const CertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificateDetail();
  }, [id]);

  const fetchCertificateDetail = async () => {
    try {
      setLoading(true);
      const response = await participantApi.getCertificateDetail(id);
      setCertificate(response.data);
    } catch (error) {
      console.error('Failed to fetch certificate:', error);
      if (error.response?.status === 404) {
        setError('Sertifikat tidak ditemukan');
      } else {
        setError('Gagal memuat detail sertifikat');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await participantApi.downloadCertificate(id);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_certificate.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Gagal mengunduh sertifikat');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{error}</h2>
        <p className="text-slate-500 mb-6">Sertifikat mungkin telah dihapus atau Anda tidak memiliki akses.</p>
        <Link 
          to="/participant/dashboard" 
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <button 
            onClick={() => navigate('/participant/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Dashboard</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status Banner */}
          {certificate.is_revoked ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Sertifikat Telah Dicabut</p>
                <p className="text-sm text-red-700">Sertifikat ini tidak lagi valid dan tidak dapat digunakan.</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Sertifikat Valid</p>
                <p className="text-sm text-green-700">Sertifikat ini aktif dan dapat diverifikasi.</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Certificate Image */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900">{certificate.title}</h1>
                </div>
                <div className="p-6">
                  <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden">
                    <img 
                      src={`http://localhost:8000${certificate.download_url}`}
                      alt={certificate.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = '/placeholder-certificate.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Download Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <button
                  onClick={handleDownload}
                  disabled={certificate.is_revoked || downloading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>Download Sertifikat</span>
                    </>
                  )}
                </button>
                {certificate.is_revoked && (
                  <p className="mt-3 text-xs text-red-600 text-center">
                    Sertifikat yang dicabut tidak dapat diunduh
                  </p>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Informasi Sertifikat</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Certificate ID</p>
                      <p className="text-sm font-mono font-medium text-slate-900 break-all">
                        {certificate.certificate_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Institusi</p>
                      <p className="text-sm font-medium text-slate-900">
                        {certificate.institution || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Tanggal Diterbitkan</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(certificate.issued_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Diterbitkan Untuk</p>
                      <p className="text-sm font-medium text-slate-900">
                        {certificate.qr_payload?.participant || '-'}
                      </p>
                    </div>
                  </div>

                  {certificate.description && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Deskripsi</p>
                      <p className="text-sm text-slate-700">{certificate.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Info */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Verifikasi QR</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Sertifikat ini memiliki QR code yang dapat diverifikasi untuk memastikan keasliannya.
                </p>
                <Link
                  to="/verify"
                  className="block w-full py-2.5 text-center border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Verifikasi Sertifikat Ini
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetail;