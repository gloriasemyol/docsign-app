import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PDFEditor() {
  const { docId } = useParams();
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [signerEmail, setSignerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchDocDetailsAndBlob = async () => {
      const token = localStorage.getItem('token');
      const cleanApiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
      
      try {
        // 1. Get document details
        const res = await axios.get(`${cleanApiUrl}/api/docs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const currentDoc = res.data.find(d => d._id === docId);
        
        if (currentDoc && currentDoc.filePath) {
          let cleanPath = currentDoc.filePath.replace(/\\/g, '/');
          if (cleanPath.startsWith('uploads/')) {
            cleanPath = cleanPath.replace('uploads/', '');
          }

          const fileDownloadUrl = `${cleanApiUrl}/uploads/${cleanPath}`;
          
          // 2. Safely download file as an isolated raw binary data stream
          const blobRes = await axios.get(fileDownloadUrl, {
            responseType: 'blob'
          });
          
          // 3. Create a stable native browser URL pointing directly to the loaded data memory
          const localUrl = URL.createObjectURL(new Blob([blobRes.data], { type: 'application/pdf' }));
          setPdfBlobUrl(localUrl);
        }
      } catch (err) {
        console.error("Error bypassing content layer systems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocDetailsAndBlob();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [docId]);

  const handlePDFClick = (e) => {
    if (!pdfRef.current) return;
    const rect = pdfRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSig = { x, y, page: 1 };
    setSignatures([...signatures, newSig]);
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (signatures.length === 0) {
      alert("Please place at least one signature block on the PDF first!");
      return;
    }
    if (!signerEmail) {
      alert("Please type a signer email address!");
      return;
    }

    const token = localStorage.getItem('token');
    const cleanApiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');

    try {
      const res = await axios.post(`${cleanApiUrl}/api/signatures/invite`,
        { 
          documentId: docId, 
          signerEmail: signerEmail, 
          x: signatures[0].x, 
          y: signatures[0].y, 
          page: signatures[0].page 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const productionSignLink = `${window.location.origin}/sign/${res.data.token}`;
      alert(`Invitation generated!\n\nLink: ${productionSignLink}`);
    } catch (err) {
      alert('Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-medium">Assembling workspace canvas...</div>;

  return (
    <div className="p-8 flex flex-col md:flex-row gap-8">
      {/* Left Column: The Native Workspace */}
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Place Signature Fields</h2>
        <p className="text-gray-500 mb-4 text-sm">Click anywhere on the document layer below to pin a digital signature box element.</p>

        {pdfBlobUrl ? (
          <div 
            className="relative inline-block border border-gray-300 rounded shadow-md overflow-hidden bg-gray-100 cursor-crosshair"
            ref={pdfRef} 
            onClick={handlePDFClick}
            style={{ width: '740px', height: '950px' }}
          >
            {/* NEW MECHANISM: Embed uses native browser binaries instead of breaking react-pdf rendering chains */}
            <embed
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              width="100%"
              height="100%"
              className="pointer-events-none"
            />

            {/* Signature drop target flags */}
            {signatures.map((sig, i) => (
              <div 
                key={i} 
                style={{ position: 'absolute', left: sig.x, top: sig.y, transform: 'translate(-50%, -50%)', zIndex: 50 }}
                className="border-2 border-dashed border-blue-500 bg-blue-50 font-bold opacity-90 w-36 h-12 flex items-center justify-center text-xs text-blue-700 shadow-md rounded pointer-events-none transition-transform"
              >
                🖋️ Signature Field {i + 1}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-red-500 font-semibold p-4 bg-red-50 border border-red-200 rounded-xl">
            Could not verify secure file asset stream access parameters.
          </div>
        )}
      </div>

      {/* Right Column: Control Sidebar Panel */}
      <div className="w-80 bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Document Actions</h3>
        
        <div className="mb-6">
          <span className="text-sm font-semibold text-gray-600 block mb-2">Active Fields Placed:</span>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
            {signatures.length} Target Box(es) Active
          </div>
        </div>

        <form onSubmit={sendInvitation} className="border-t pt-4">
          <label className="text-sm font-semibold text-gray-600 block mb-2">Recipient Email Address</label>
          <input 
            type="email" 
            placeholder="client@gmail.com"
            className="w-full border rounded-lg p-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            Generate Signing Link
          </button>
        </form>
      </div>
    </div>
  );
}