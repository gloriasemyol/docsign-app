import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function SignPage() {
  const { token } = useParams();
  const [sigData, setSigData] = useState(null);
  const [typedName, setTypedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSigned, setIsSigned] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');

  const cleanApiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');

  useEffect(() => {
    const fetchSignatureDetails = async () => {
      try {
        const res = await axios.get(`${cleanApiUrl}/api/signatures/token/${token}`);
        setSigData(res.data);
      } catch (err) {
        console.error("Error verifying public signing handshake token parameters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignatureDetails();
  }, [token, cleanApiUrl]);

  const handleCommitSignature = async (e) => {
    e.preventDefault();
    if (!typedName.trim()) {
      alert("Please type your name to sign the document!");
      return;
    }

    try {
      // 1. Submit the signature action data block to update status to 'signed'
      await axios.patch(`${cleanApiUrl}/api/signatures/${sigData._id}/sign`, {
        typedName: typedName
      });

      // 2. TRIGGER THE FINALIZER: This instructs the backend to merge the text into the file structure
      try {
        const finalizeRes = await axios.post(`${cleanApiUrl}/api/signatures/finalize/${sigData.document}`);
        if (finalizeRes.data && finalizeRes.data.path) {
          setDownloadPath(finalizeRes.data.path);
        }
      } catch (finalizeErr) {
        console.warn("PDF generation script hook bypassed or missing path headers:", finalizeErr.message);
      }

      setIsSigned(true);
    } catch (err) {
      alert('Signature transaction processing error: ' + (err.response?.data?.message || err.message));
    }
  };

  const downloadFileDirectly = () => {
    if (!downloadPath) {
      alert("No signed binary asset stream could be parsed for this transaction.");
      return;
    }
    let cleanPath = downloadPath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.replace('uploads/', '');
    }
    window.open(`${cleanApiUrl}/uploads/${cleanPath}`, '_blank');
  };

  if (loading) return <div className="p-8 text-gray-500 font-medium">Verifying secure audit link token vectors...</div>;
  if (!sigData) return <div className="p-8 text-red-500 font-bold">This signing invitation link is invalid or has expired!</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        {!isSigned ? (
          <>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🖋️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Secure Signature Request</h2>
            <p className="text-gray-500 text-sm mb-6">You have been invited to digitally sign a secure document layer.</p>
            
            <div className="p-3 bg-gray-50 text-left rounded-lg text-xs text-gray-600 mb-6 space-y-1">
              <div><span className="font-semibold text-gray-700">Recipient Email:</span> {sigData.signerEmail}</div>
              <div><span className="font-semibold text-gray-700">Target Field Point:</span> X: {sigData.x} | Y: {sigData.y}</div>
            </div>

            <form onSubmit={handleCommitSignature} className="space-y-4">
              <div className="text-left">
                <label className="text-xs font-bold text-gray-600 block mb-2">TYPE YOUR FULL NAME TO SIGN</label>
                <input 
                  type="text"
                  placeholder="Gloria Semyol"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full border rounded-xl p-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                Confirm & Apply Digital Signature
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Signed Successfully!</h2>
            <p className="text-gray-500 text-sm mb-6">Your secure signing transaction has been logged inside our cryptographic audit trail.</p>

            <div className="space-y-3">
              <button 
                onClick={downloadFileDirectly}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
              >
                📥 Download Signed Document
              </button>

              <Link 
                to="/dashboard" 
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition block"
              >
                Return to Dashboard Workspace
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}