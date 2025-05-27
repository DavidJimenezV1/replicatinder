// src/components/ProfileCard.js

import React from 'react';
import './ProfileCard.css'; // Estilos para la tarjeta

function ProfileCard({ user }) {
  // `user` debería tener propiedades como `name`, `age`, `bio`, `photos`
  // Para este ejemplo, usaremos un objeto de usuario simplificado.
  const imageUrl = user.photos && user.photos.length > 0 ? user.photos[0] : 'https://via.placeholder.com/400x500?text=User+Image'; // Imagen placeholder

  return (
    <div className="profile-card">
      <div className="card-image-container">
        <img src={imageUrl} alt={user.name} className="card-image" />
        <div className="card-gradient-overlay"></div> {/* Degradado sobre la imagen */}
        <div className="card-info">
          <h2>{user.name}, {user.age}</h2>
          <p>{user.bio}</p>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;