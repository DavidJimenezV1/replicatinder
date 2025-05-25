// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const Dashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUserAndProfiles();
  }, []);

  async function fetchCurrentUserAndProfiles() {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Obtener IDs de perfiles con los que ya se interactuó
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interacciones') // Tu tabla 'interacciones'
        .select('swiped_id')
        .eq('swiper_id', user.id); // Interacciones hechas por el usuario actual

      if (interactionsError) throw interactionsError;
      const interactedProfileIds = interactionsData.map(i => i.swiped_id);
      interactedProfileIds.push(user.id); // No mostrar el propio perfil

      // Obtener perfiles de otros usuarios que no han sido "swiped" por el usuario actual
      const { data: profilesData, error: profilesError } = await supabase
        .from('usuario') // Tu tabla 'usuario'
        .select('id, nombre, fecha_nacimiento, biografia, multimedia(url)') // Incluye multimedia
        .neq('id', user.id) // No mostrar el propio perfil
        .not('id', 'in', `(${interactedProfileIds.join(',')})`); // Excluir perfiles ya interactuados

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

    } catch (error) {
      alert('Error cargando perfiles: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleInteraction = async (type) => {
    if (!profiles.length || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];

    try {
      // 1. Registrar la interacción
      const { error: interactionError } = await supabase
        .from('interacciones')
        .insert({
          swiper_id: currentUser.id,
          swiped_id: targetProfile.id,
          tipo_interaccion: type,
        });
      if (interactionError) throw interactionError;

      // 2. Si es un 'like', verificar si hay un match mutuo
      if (type === 'like') {
        const { data: reciprocalLike, error: reciprocalError } = await supabase
          .from('interacciones')
          .select('id')
          .eq('swiper_id', targetProfile.id) // El otro usuario
          .eq('swiped_id', currentUser.id) // Le dio like al usuario actual
          .eq('tipo_interaccion', 'like')
          .single();

        if (reciprocalError && reciprocalError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw reciprocalError;
        }

        if (reciprocalLike) {
          // ¡Es un match! Registrar en la tabla 'matches'
          // Asegurar que user1_id < user2_id para la unicidad
          const user1 = currentUser.id < targetProfile.id ? currentUser.id : targetProfile.id;
          const user2 = currentUser.id < targetProfile.id ? targetProfile.id : currentUser.id;

          const { error: matchError } = await supabase.from('matches').insert({
            user1_id: user1,
            user2_id: user2,
          });
          if (matchError && matchError.code !== '23505') { // 23505 is unique violation (match already exists)
             throw matchError;
          } else if (!matchError) {
            alert(`¡Es un Match con ${targetProfile.nombre}!`);
          }
        }
      }
    } catch (error) {
      alert('Error al interactuar: ' + error.message);
      console.error(error);
    } finally {
      // Mover al siguiente perfil
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando perfiles...</div>;
  }

  if (!profiles.length || currentIndex >= profiles.length) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>No hay más perfiles por ahora. ¡Vuelve más tarde!</div>;
  }

  const currentProfile = profiles[currentIndex];
  const age = currentProfile.fecha_nacimiento ? new Date().getFullYear() - new Date(currentProfile.fecha_nacimiento).getFullYear() : 'N/A';
  const profileImageUrl = currentProfile.multimedia && currentProfile.multimedia.length > 0
                           ? currentProfile.multimedia[0].url
                           : 'https://via.placeholder.com/200?text=No+Photo'; // Imagen de placeholder

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
      <h2>{currentProfile.nombre}, {age}</h2>
      <img
        src={profileImageUrl}
        alt={currentProfile.nombre}
        style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
      />
      <p>{currentProfile.biografia || 'Sin biografía.'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        <button
          onClick={() => handleInteraction('dislike')}
          style={{ padding: '12px 25px', fontSize: '18px', borderRadius: '50%', border: 'none', backgroundColor: '#ff4d4d', color: 'white', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        >
          👎
        </button>
        <button
          onClick={() => handleInteraction('like')}
          style={{ padding: '12px 25px', fontSize: '18px', borderRadius: '50%', border: 'none', backgroundColor: '#00cc66', color: 'white', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        >
          ❤️
        </button>
      </div>
    </div>
  );
};

export default Dashboard;