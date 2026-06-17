import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Added the navigation import at the top
import { getDocs, uploadDoc } from '../api';

export default function Dashboard() {
  const navigate = useNavigate(); // 2. Initialized the navigate hook here
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 3. Added the filter state tracking

  // Load documents when page opens
  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const res = await getDocs();
      setDocs(res.data);
    } catch (err) {
      console.error('Failed to load docs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      await uploadDoc(formData);
      loadDocs(); // reload the list
    } catch (err) {
      alert('Upload failed');
    }
  };

  // 4. Added the filtering logic right here before we return the interface
  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Documents</h1>

        {/* 5. Added the gorgeous filter pills bar below your header */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'signed', 'rejected'].map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded-full text-sm border transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Upload button */}
        <label className="block mb-6 cursor-pointer bg-blue-600 text-white
          px-4 py-2 rounded-lg w-fit hover:bg-blue-700">
          + Upload PDF
          <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
        </label>

        {/* Document list */}
        {loading ? <p>Loading...</p> : (
          <div className="grid gap-4">
            {/* 6. Swapped 'docs.map' with 'filtered.map' to activate the filter system */}
            {filtered.map(doc => (
              
              /* ---> THE IMPROVED CARD CONTAINER IS EXACTLY HERE NOW <--- */
              <div key={doc._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                  flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📄</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{doc.originalName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString('en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    doc.status === 'signed'   ? 'bg-green-50 text-green-700' :
                    doc.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{doc.status}</span>
                  <button onClick={() => navigate(`/editor/${doc._id}`)}
                    className="text-xs text-blue-600 font-medium hover:underline">
                    Open →
                  </button>
                </div>
              </div>
              /* ---> END OF IMPROVED CARD CONTAINER <--- */

            ))}
            
            {filtered.length === 0 && (
              <p className="text-gray-500">No {filter !== 'all' ? filter : ''} documents found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}