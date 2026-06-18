import React, { useState } from 'react';
import { login } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-xl font-bold mb-6">Sign In</h2>
        <input 
          type="email" 
          placeholder="Email"
          className="w-full border rounded-lg p-2 mb-4"
          value={form.email} 
          onChange={e => setForm({...form, email: e.target.value})} 
        />
        <input 
          type="password" 
          placeholder="Password"
          className="w-full border rounded-lg p-2 mb-6"
          value={form.password} 
          onChange={e => setForm({...form, password: e.target.value})} 
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Login
        </button>
        <p className="text-center mt-4 text-sm">
          No account? <a href="/register" className="text-blue-600">Register</a>
        </p>
      </form>
    </div>
  );
}