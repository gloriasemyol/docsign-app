import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFEditor() {
  const { docId } = useParams();
  const [filePath, setFilePath] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [signerEmail, setSignerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchDocDetails = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api/docs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const currentDoc = res.data.find(d => d._id === docId);
        if (currentDoc) {
          setFilePath(currentDoc.filePath);
        }
      } catch (err) {
        console.error("Error fetching document details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetails();
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
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api/signatures/invite`,
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
      console.log("Generated Link:", productionSignLink);
    } catch (err) {
      alert('Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8">Loading document editor...</div>;

  return (
    <div className="p-8 flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-2">Place Signature Fields</h2>
        <p className="text-gray-500 mb-4">Click anywhere on the PDF pages below to place a signature field block.</p>

        {filePath ? (
          <div className="relative inline-block border-2 border-gray-200 rounded cursor-crosshair"
            ref={pdfRef} onClick={handlePDFClick}>

            <Document 
              file={`${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/${filePath.replace(/\\/g, '/')}`}
              onLoadError={(err) => console.error("PDF Load Error:", err)}
              loading={<div className="p-4 text-blue-600 font-medium">Downloading PDF Asset from Render...</div>}
            >
              <Page pageNumber={1} width={700} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>

            {signatures.map((sig, i) => (
              <div key={i} style={{ position: 'absolute', left: sig.x, top: sig.y, transform: 'translate(-50%, -50%)' }}
                className="border-2 border-dashed border-blue-500 bg-blue-50 opacity-70 w-32 h-10 flex items-center justify-center text-xs text-blue-600 pointer-events-none">
                Signature {i + 1}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-red-500 font-semibold">Could not find or retrieve PDF binary path file.</div>
        )}
      </div>

      <div className="w-80 bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Document Actions</h3>
        
        <div className="mb-6">
          <span className="text-sm font-semibold text-gray-600 block mb-2">Active Fields Placed:</span>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 font-medium">
            {signatures.length} Signature Target Box(es)
          </div>
        </div>

        <form onSubmit={sendInvitation} className="border-t pt-4">
          <label className="text-sm font-semibold text-gray-600 block mb-2">Recipient Email Address</label>
          <input 
            type="email" 
            placeholder="client@gmail.com"
            className="w-full border rounded-lg p-2 text-sm mb-4"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Generate Signing Link
          </button>
        </form>
      </div>
    </div>
  );
}