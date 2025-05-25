// src/pages/Matches.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

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

      // Obtener los matches donde el usuario actual es user1 o user2
      const { data, error } = await supabase
        .from('matches') // Tu tabla 'matches'
        .select(`
          user1_id,
          user2_id,
          matched_at,
          user1:user1_id (nombre, multimedia(url)),
          user2:user2_id (nombre, multimedia(url))
        `)
        .or(`user1_id.eq.<span class="math-inline">\{user\.id\},user2\_id\.eq\.</span>{user.id}`);

      if (error) throw error;

      // Procesar los matches para mostrar el perfil del "otro" usuario
      const processedMatches = data.map(match => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherProfileImageUrl = otherUser.multimedia && otherUser.multimedia.length > 0
                                    ? otherUser.multimedia[0].url
                                    : 'https://via.placeholder.com/100?text=No+Photo';

        return {
          id: match.id, // ID del match
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
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando tus matches...</div>;
  }

  if (!matches.length) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Aún no tienes matches. ¡Sigue deslizando!</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Mis Matches</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {matches.map((match) => (
          <div key={match.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <img
              src={match.otherProfileImageUrl}
              alt={match.otherUserName}
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }}
            />
            <h3>{match.otherUserName}</h3>
            <p>Match desde: {new Date(match.matched_at).toLocaleDateString()}</p>
            {/* Aquí podrías añadir un botón para iniciar un chat */}
            <button style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Chatear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matches;