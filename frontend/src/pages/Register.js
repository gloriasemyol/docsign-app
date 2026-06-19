import React, { useState } from 'react';
import { register } from '../api'; // This hooks into your backend API setup
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegisterClick = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill out all fields first!");
      return;
    }
    
    try {
      console.log("Sending registration data to backend:", form);
      // Calls your api.js register function
      await register(form); 
      alert("Registration successful! Please log in.");
      navigate('/login'); // Sends you back to log in with your fresh account
    } catch (err) {
      console.error("Registration Error details:", err);
      alert('Registration failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-xl font-bold mb-6">Create Account</h2>
        
        <input 
          type="text" 
          placeholder="Full Name"
          className="w-full border rounded-lg p-2 mb-4"
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
        />
        
        <input 
          type="email" 
          placeholder="Email Address"
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
        
        <button 
          type="button" 
          onClick={handleRegisterClick}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Register
        </button>
        
        <p className="text-center mt-4 text-sm">
          Already have an account? <a href="/login" className="text-blue-600">Sign In</a>
        </p>
      </div>
    </div>
  );
}