// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error al cerrar sesión: ' + error.message);
    } else {
      navigate('/auth'); // Redirige al login después de cerrar sesión
    }
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8f8f8', borderBottom: '1px solid #eee' }}>
      <nav>
        <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', color: '#007bff' }}>Dashboard</Link>
        <Link to="/profile-setup" style={{ marginRight: '15px', textDecoration: 'none', color: '#007bff' }}>Mi Perfil</Link>
        <Link to="/matches" style={{ textDecoration: 'none', color: '#007bff' }}>Mis Matches</Link>
      </nav>
      <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </header>
  );
};

export default Header;