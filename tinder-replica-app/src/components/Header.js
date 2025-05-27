// src/components/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate de haber instalado react-icons: npm install react-icons
import { FaUser, FaFire, FaCommentDots } from 'react-icons/fa'; 
import { supabase } from '../supabase/client'; // Para la función de cerrar sesión

function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error al cerrar sesión: ' + error.message);
      console.error('Error al cerrar sesión:', error);
    } else {
      navigate('/auth'); // Redirige al login después de cerrar sesión
    }
  };

  // Componente para el logo de Tinder con degradado (puedes reemplazarlo por una imagen SVG real)
  const TinderLogo = () => (
    <div style={{
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, var(--tinder-red-start), var(--tinder-red-end))', /* Degradado de Tinder */
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
    }}>
      tinder
    </div>
  );

  return (
    <header className="header"> {/* Usa la clase CSS "header" */}
      <div className="header-left">
        {/* Icono de perfil. Al hacer clic, navega a la configuración del perfil. */}
        <FaUser className="header-icon" onClick={() => navigate('/profile-setup')} />
      </div>
      <div className="header-center">
        <TinderLogo /> {/* El logo de Tinder */}
      </div>
      <div className="header-right">
        {/* Icono de mensajes/matches. Al hacer clic, navega a los matches. */}
        <FaCommentDots className="header-icon" onClick={() => navigate('/matches')} />
        {/* Botón de cerrar sesión */}
        <button onClick={handleLogout} className="header-logout-button"> {/* Usa la clase "header-logout-button" */}
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}

export default Header;