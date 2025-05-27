// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
// import Header from '../components/Header'; // <--- ELIMINAR O COMENTAR ESTA LÍNEA
import ProfileCard from '../components/ProfileCard'; // Importa el componente de la tarjeta
import { FaTimes, FaRedo, FaStar, FaHeart, FaBolt } from 'react-icons/fa'; // Iconos para los botones
import './Dashboard.css'; // Estilos para la página Dashboard y los botones


const Dashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Estado para el usuario actual

  useEffect(() => {
    fetchCurrentUserAndProfiles();
  }, []);

  async function fetchCurrentUserAndProfiles() {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user); // Asegúrate de que currentUser se establezca aquí

      console.log("Usuario autenticado (currentUser):", user);
      if (!user || !user.id) {
        console.error("ID de usuario no disponible. Redirigiendo a autenticación o esperando...");
        setLoading(false);
        return;
      }

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
      alert('Error cargando perfiles o usuario: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleInteraction = async (type) => {
    if (!profiles.length || currentIndex >= profiles.length) return;
    if (!currentUser || !currentUser.id) {
      alert("No se pudo registrar la interacción: el ID de tu usuario no está disponible.");
      console.error("handleInteraction: currentUser o currentUser.id es nulo/indefinido.");
      return;
    }

    const targetProfile = profiles[currentIndex];

    console.log("Intentando interacción:", {
      swiper_id: currentUser.id,
      swiped_id: targetProfile.id,
      tipo_interaccion: type
    });

    try {
      // 1. Registrar la interacción
      const { error: interactionError } = await supabase
        .from('interacciones')
        .insert({
          swiper_id: currentUser.id, // Asegúrate de que esto sea el ID del usuario de la sesión
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
    return (
      <div className="dashboard-container">
        {/* <Header />  <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
        <div className="loading-message">Cargando perfiles...</div>
      </div>
    );
  }

  if (!profiles.length || currentIndex >= profiles.length) {
    return (
      <div className="dashboard-container">
        {/* <Header />  <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
        <div className="no-users-message">No hay más perfiles por ahora. ¡Vuelve más tarde!</div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const age = currentProfile.fecha_nacimiento ? new Date().getFullYear() - new Date(currentProfile.fecha_nacimiento).getFullYear() : 'N/A';
  const profileImageUrl = currentProfile.multimedia && currentProfile.multimedia.length > 0
                           ? currentProfile.multimedia[0].url
                           : 'https://via.placeholder.com/400x500?text=No+Photo'; // Imagen de placeholder

  return (
    <div className="dashboard-container">
      {/* <Header />  <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
      <main className="dashboard-content">
        <div className="card-wrapper">
          <ProfileCard user={{
            name: currentProfile.nombre,
            age: age,
            bio: currentProfile.biografia,
            photos: [profileImageUrl] // ProfileCard espera un array de fotos
          }} />
        </div>
        <div className="action-buttons">
          <button className="icon-button dislike" onClick={() => handleInteraction('dislike')}>
            <FaTimes />
          </button>
          <button className="icon-button rewind" onClick={() => console.log('Rewind no implementado.')}>
            <FaRedo />
          </button>
          <button className="icon-button superlike" onClick={() => handleInteraction('super_like')}>
            <FaStar />
          </button>
          <button className="icon-button like" onClick={() => handleInteraction('like')}>
            <FaHeart />
          </button>
          <button className="icon-button boost" onClick={() => console.log('Boost no implementado.')}>
            <FaBolt />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;