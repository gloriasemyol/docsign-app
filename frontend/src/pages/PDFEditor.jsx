import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import axios from 'axios';

// Required setup for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFEditor({ docId, filePath }) {
  const [signatures, setSignatures] = useState([]);
  const pdfRef = useRef(null);

  // When user clicks on the PDF, place a signature box there
  const handlePDFClick = (e) => {
    const rect = pdfRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;   // how far from left edge
    const y = e.clientY - rect.top;    // how far from top edge

    const newSig = { x, y, page: 1 };
    setSignatures([...signatures, newSig]);
  };

  const saveSignatures = async () => {
    const token = localStorage.getItem('token');
    try {
      for (const sig of signatures) {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/signatures`,
          { documentId: docId, x: sig.x, y: sig.y, page: sig.page },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Signature positions saved!');
    } catch (err) {
      alert('Failed to save');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Place Signature Fields</h2>
      <p className="text-gray-500 mb-4">Click anywhere on the PDF to place a signature box</p>

      <div className="relative inline-block border-2 border-gray-200 rounded"
        ref={pdfRef} onClick={handlePDFClick}>

        {/* Show the PDF */}
        <Document file={`${process.env.REACT_APP_API_URL}/${filePath}`}>
          <Page pageNumber={1} width={700} />
        </Document>

        {/* Show signature boxes as overlays */}
        {signatures.map((sig, i) => (
          <div key={i} style={{ position: 'absolute', left: sig.x, top: sig.y,
            transform: 'translate(-50%, -50%)' }}
            className="border-2 border-dashed border-blue-500 bg-blue-50
              opacity-70 w-32 h-10 flex items-center justify-center text-xs text-blue-600">
            Signature {i + 1}
          </div>
        ))}
      </div>

      <button onClick={saveSignatures}
        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
        Save Signature Positions
      </button>
    </div>
  );
}