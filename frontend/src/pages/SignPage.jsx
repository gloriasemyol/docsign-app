import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function SignPage() {
  const { token } = useParams();
  const [sig, setSig] = useState(null);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api/signatures/token/${token}`)
      .then(r => {
        setSig(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Token checking error:", err);
        setSig(null);
        setLoading(false);
      });
  }, [token]);

  const handleAction = async (action) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api/signatures/${sig._id}/status`,
        { status: action, reason });
      setDone(true);
    } catch (err) {
      alert('Action failed submission processing.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Verifying secure signature token...</div>;
  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm">
        <p className="text-3xl font-bold text-green-600">✓ Signed</p>
        <p className="text-gray-500 mt-2 text-sm">Your secure signing transaction has been logged inside our cryptographic audit trail.</p>
      </div>
    </div>
  );

  if (!sig) return <p className="p-8 text-red-500 font-semibold text-center">Invalid or expired document link.</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Review & Sign</h2>
        <p className="text-gray-500 mb-6 text-sm">You have been requested to verify and append a digital sign-off configuration.</p>
        
        <textarea
          placeholder="Add signature notes or reason (Required if rejecting document)"
          className="w-full border rounded-lg p-3 mb-4 h-24 text-sm focus:outline-blue-500"
          value={reason} onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-4">
          <button onClick={() => handleAction('signed')}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm">
            Sign Document
          </button>
          <button onClick={() => handleAction('rejected')}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition shadow-sm">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}