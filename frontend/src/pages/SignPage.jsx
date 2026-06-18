import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function SignPage() {
  const { token } = useParams();
  const [sig, setSig] = useState(null);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Load signature info by token
    axios.get(`${process.env.REACT_APP_API_URL}/api/signatures/token/${token}`)
      .then(r => setSig(r.data))
      .catch(() => setSig(null));
  }, [token]);

  const handleAction = async (action) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/api/signatures/${sig._id}/status`,
        { status: action, reason });
      setDone(true);
    } catch {
      alert('Action failed');
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">Done!</p>
        <p className="text-gray-500 mt-2">Your response has been recorded.</p>
      </div>
    </div>
  );

  if (!sig) return <p className="p-8 text-red-500">Invalid or expired link.</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Review & Sign</h2>
        <p className="text-gray-600 mb-6">You have been asked to sign a document.</p>
        <textarea
          placeholder="Reason (required if rejecting)"
          className="w-full border rounded-lg p-2 mb-4 h-20"
          value={reason} onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-4">
          <button onClick={() => handleAction('signed')}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
            Sign Document
          </button>
          <button onClick={() => handleAction('rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}