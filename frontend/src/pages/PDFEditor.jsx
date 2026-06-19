import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // <-- Added to read :docId from URL
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFEditor() {
  const { docId } = useParams(); // <-- Dynamically extracts docId from URL bar
  const [filePath, setFilePath] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef(null);

  // Fetch document path from the backend on load
  useEffect(() => {
    const fetchDocDetails = async () => {
      const token = localStorage.getItem('token');
      try {
        // Fetch all documents from your existing GET /api/docs endpoint
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/docs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Find our matching document inside the array
        const currentDoc = res.data.find(d => d._id === docId);
        if (currentDoc) {
          setFilePath(currentDoc.filePath);
        } else {
          console.error("Document not found in list");
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

  const saveSignatures = async () => {
    if (signatures.length === 0) {
      alert("Please click on the PDF to place at least one signature block first!");
      return;
    }
    const token = localStorage.getItem('token');
    try {
      for (const sig of signatures) {
        // Corrected route mapping to match your signatureRoutes.js entry point
        await axios.post(`${process.env.REACT_APP_API_URL}/api/signatures`,
          { documentId: docId, x: sig.x, y: sig.y, page: sig.page },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Signature positions saved successfully!');
    } catch (err) {
      console.error("Save failed details:", err);
      alert('Failed to save signature position: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8">Loading document editor...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Place Signature Fields</h2>
      <p className="text-gray-500 mb-4">Click anywhere on the PDF to place a signature box</p>

      {filePath ? (
        <div className="relative inline-block border-2 border-gray-200 rounded cursor-crosshair"
          ref={pdfRef} onClick={handlePDFClick}>

          {/* Points directly to your static server upload asset link */}
          <Document 
            file={`${process.env.REACT_APP_API_URL}/${filePath.replace(/\\/g, '/')}`}
            onLoadError={(err) => console.error("PDF Load Error:", err)}
          >
            <Page pageNumber={1} width={700} renderTextLayer={false} />
          </Document>

          {signatures.map((sig, i) => (
            <div key={i} style={{ position: 'absolute', left: sig.x, top: sig.y,
              transform: 'translate(-50%, -50%)' }}
              className="border-2 border-dashed border-blue-500 bg-blue-50
                opacity-70 w-32 h-10 flex items-center justify-center text-xs text-blue-600 pointer-events-none">
              Signature {i + 1}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-red-500 font-semibold">Could not find or retrieve PDF binary path file.</div>
      )}

      <div className="mt-4">
        <button onClick={saveSignatures}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
          Save Signature Positions
        </button>
      </div>
    </div>
  );
}