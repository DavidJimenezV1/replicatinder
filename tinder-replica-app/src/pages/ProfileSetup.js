// src/pages/ProfileSetup.js (Modificación)
import React, { useState, useEffect, useCallback } from 'react'; // <--- Añadimos useCallback
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const ProfileSetup = () => {
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [roll, setRoll] = useState('user');
  const [biografia, setBiografia] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(''); // Estado para el correo
  const navigate = useNavigate();

  // Mueve la función getProfile y la función uploadProfilePic DENTRO del componente
  // y envuélvelas en useCallback si dependen de estados/props para evitar recreaciones innecesarias
  // O simplemente decláralas dentro si son funciones que no cambian mucho.
  // Para este caso, las declararemos directamente dentro del componente.

  // Añadimos useCallback para getProfile para evitar el warning de eslint
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
          navigate('/auth');
          return;
      }
      setUserEmail(user.email); // Guardamos el correo del usuario logueado

      let { data, error, status } = await supabase
        .from('usuario')
        .select(`nombre, fecha_nacimiento, telefono, roll, biografia`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setNombre(data.nombre || '');
        setFechaNacimiento(data.fecha_nacimiento || '');
        setTelefono(data.telefono || '');
        setRoll(data.roll || 'user');
        setBiografia(data.biografia || '');
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('multimedia')
          .select('url')
          .eq('usuarioid', user.id)
          .limit(1)
          .single();
        
        if (mediaError && mediaError.code !== 'PGRST116') {
          console.error('Error loading media:', mediaError);
        }
        if (mediaData) {
          setProfilePicUrl(mediaData.url);
        }
      }
    } catch (error) {
      alert('Error cargando el perfil: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [navigate]); // navigate es la única dependencia que cambia

  useEffect(() => {
    getProfile();
  }, [getProfile]); // <--- getProfile es ahora una dependencia del useEffect

  async function updateProfile(event) {
    event.preventDefault();
    setLoading(true);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (!user) {
        alert('No hay usuario autenticado para actualizar el perfil.');
        setLoading(false);
        navigate('/auth');
        return;
    }
    
    const updates = {
      id: user.id,
      correo: user.email,
      nombre,
      fecha_nacimiento: fechaNacimiento || null,
      telefono,
      roll,
      biografia,
      updated_at: new Date(),
    };

    let { error } = await supabase.from('usuario').upsert(updates);

    if (error) {
      alert('Error actualizando el perfil: ' + error.message);
      console.error(error);
    } else {
      alert('Perfil actualizado exitosamente!');
      navigate('/');
    }
    setLoading(false);
  }

  // <--- Mueve esta función DENTRO del componente ProfileSetup
  async function uploadProfilePic(event) {
    try {
      setUploading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
          alert('No hay usuario autenticado para subir la foto.');
          setUploading(false);
          return;
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('profile-pics') // Define un bucket para las fotos de perfil en Supabase Storage
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-pics')
        .getPublicUrl(filePath);

      const newProfilePicUrl = publicUrlData.publicUrl;
      setProfilePicUrl(newProfilePicUrl);

      const { error: mediaInsertError } = await supabase.from('multimedia').upsert({
        usuarioid: user.id,
        url: newProfilePicUrl
      }, { onConflict: 'usuarioid' });

      if (mediaInsertError) {
        throw mediaInsertError;
      }
      alert('Foto de perfil subida y actualizada!');

    } catch (error) {
      alert('Error subiendo la foto: ' + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  }
  // <--- Fin de la función uploadProfilePic (ahora dentro del componente)

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Configurar Perfil</h2>
      {loading ? (
        <p>Cargando perfil...</p>
      ) : (
        <form onSubmit={updateProfile}>
          {/* Opcional: Mostrar el correo (solo lectura) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input type="email" value={userEmail} disabled style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: '#f0f0f0' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="nombre" style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="fechaNacimiento" style={{ display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento:</label>
            <input
              type="date"
              id="fechaNacimiento"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="telefono" style={{ display: 'block', marginBottom: '5px' }}>Teléfono:</label>
            <input
              type="text"
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="biografia" style={{ display: 'block', marginBottom: '5px' }}>Biografía (opcional):</label>
            <textarea
              id="biografia"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              rows="4"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            ></textarea>
          </div>

          {/* Sección para subir foto de perfil */}
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            {profilePicUrl && (
              <img src={profilePicUrl} alt="Foto de Perfil" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
            )}
            <div>
              <label htmlFor="single" style={{ display: 'block', marginBottom: '5px' }}>
                Subir Foto de Perfil:
              </label>
              <input
                type="file"
                id="single"
                accept="image/*"
                onChange={uploadProfilePic} // <-- Ahora uploadProfilePic está definido en este ámbito
                disabled={uploading}
              />
            </div>
            {uploading && <p>Subiendo foto...</p>}
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfileSetup;