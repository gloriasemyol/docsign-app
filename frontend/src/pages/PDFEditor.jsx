import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PDFEditor() {
  const { docId } = useParams();
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [signerEmail, setSignerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLayoutSaved, setIsLayoutSaved] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(''); // New state to hold copyable link
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchDocDetailsAndBlob = async () => {
      const token = localStorage.getItem('token');
      const cleanApiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
      
      try {
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
          
          const blobRes = await axios.get(fileDownloadUrl, {
            responseType: 'blob'
          });
          
          const localUrl = URL.createObjectURL(new Blob([blobRes.data], { type: 'application/pdf' }));
          setPdfBlobUrl(localUrl);
        }
      } catch (err) {
        console.error("Error downloading secure document content layers:", err);
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
    setIsLayoutSaved(false); 
    setGeneratedLink(''); // Reset link if layout changes
  };

  const saveSignatureLayout = async () => {
    if (signatures.length === 0) {
      alert("Please place at least one signature block on the PDF first!");
      return;
    }

    const token = localStorage.getItem('token');
    const cleanApiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');

    try {
      await axios.post(`${cleanApiUrl}/api/signatures`,
        { 
          documentId: docId, 
          x: signatures[0].x, 
          y: signatures[0].y, 
          page: signatures[0].page,
          signerEmail: signerEmail || "pending@setup.com"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsLayoutSaved(true);
      alert("Save signature place successfully!");
    } catch (err) {
      alert('Failed to save layout setup: ' + (err.response?.data?.message || err.message));
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!isLayoutSaved) {
      alert("Please click 'Save Signature Layout' before generating the signing link!");
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
      setGeneratedLink(productionSignLink); // Store the link to show it in the UI!
      alert("Signing link generated successfully! Look down at the control panel to copy it.");
    } catch (err) {
      alert('Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-medium">Assembling workspace canvas...</div>;

  return (
    <div className="p-8 flex flex-col md:flex-row gap-8">
      {/* Left Column: Canvas */}
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
            <embed
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              width="100%"
              height="100%"
              className="pointer-events-none"
            />

            {signatures.map((sig, i) => (
              <div 
                key={i} 
                style={{ position: 'absolute', left: sig.x, top: sig.y, transform: 'translate(-50%, -50%)', zIndex: 50 }}
                className="border-2 border-dashed border-blue-500 bg-blue-50 font-bold opacity-90 w-36 h-12 flex items-center justify-center text-xs text-blue-700 shadow-md rounded pointer-events-none"
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

      {/* Right Column: Control Panel */}
      <div className="w-80 bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Document Actions</h3>
        
        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-600 block mb-2">Active Fields Placed:</span>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold mb-3">
            {signatures.length} Target Box(es) Active
          </div>
          
          <button 
            type="button" 
            onClick={saveSignatureLayout}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
              isLayoutSaved ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-800 text-white hover:bg-gray-900'
            }`}
          >
            {isLayoutSaved ? '✓ Layout Saved!' : 'Save Signature Layout'}
          </button>
        </div>

        <form onSubmit={sendInvitation} className="border-t pt-4 mt-4">
          <label className="text-sm font-semibold text-gray-600 block mb-2">Recipient Email Address</label>
          <input 
            type="email" 
            placeholder="gloriasemyol@gmail.com"
            className="w-full border rounded-lg p-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={!isLayoutSaved}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition shadow-sm mb-4 ${
              isLayoutSaved ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Generate Signing Link
          </button>
        </form>

        {/* NEW WORKFLOW BLOCK: Displays text inside an input element so you can easily copy it! */}
        {generatedLink && (
          <div className="border-t pt-4 mt-2">
            <label className="text-xs font-bold text-green-700 block mb-1">🔗 COPY SIGNING LINK:</label>
            <input 
              type="text" 
              readOnly 
              value={generatedLink}
              onClick={(e) => e.target.select()}
              className="w-full bg-gray-50 border border-green-200 text-gray-800 p-2 text-xs rounded-lg cursor-pointer focus:outline-none"
              placeholder="Click to select link"
            />
            <p className="text-[10px] text-gray-400 mt-1">Click inside the box above to instantly highlight and copy your live testing link!</p>
          </div>
        )}
      </div>
    </div>
  );
}