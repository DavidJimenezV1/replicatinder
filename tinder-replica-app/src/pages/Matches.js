// src/pages/Matches.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
// import Header from '../components/Header'; // <--- ELIMINAR O COMENTAR ESTA LÍNEA
import './Matches.css'; // Importa los estilos para la página de Matches

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      const { data, error } = await supabase
        .from('matches') // Tu tabla 'matches'
        .select(`
          user1_id,
          user2_id,
          matched_at,
          user1:user1_id (nombre, multimedia(url)),
          user2:user2_id (nombre, multimedia(url))
        `)
        .or(`user1_id.eq.<span class="math-inline">\{user\.id\},user2\_id\.eq\.</span>{user.id}`); // Corregir escapes si es necesario aquí

      if (error) throw error;

      const processedMatches = data.map(match => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherProfileImageUrl = otherUser.multimedia && Array.isArray(otherUser.multimedia) && otherUser.multimedia.length > 0
                                    ? otherUser.multimedia[0].url
                                    : 'https://via.placeholder.com/100?text=No+Photo';

        return {
          id: match.id,
          matched_at: match.matched_at,
          otherUserName: otherUser.nombre,
          otherUserId: otherUserId,
          otherProfileImageUrl: otherProfileImageUrl
        };
      });

      setMatches(processedMatches);

    } catch (error) {
      alert('Error cargando matches: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="matches-container">
        {/* <Header /> <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
        <div className="loading-message">Cargando tus matches...</div>
      </div>
    );
  }

  return (
    <div className="matches-container">
      {/* <Header /> <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
      <main className="matches-content">
        <h1>Tus Matches</h1>
        <div className="matches-grid">
          {matches.length > 0 ? (
            matches.map(match => (
              <div key={match.otherUserId} className="match-card">
                <img src={match.otherProfileImageUrl} alt={match.otherUserName} className="match-avatar" />
                <span className="match-name">{match.otherUserName}</span>
              </div>
            ))
          ) : (
            <p className="no-matches-message">Aún no tienes matches. ¡Sigue deslizando!</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Matches;