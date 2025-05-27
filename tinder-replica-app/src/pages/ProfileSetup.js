// src/pages/ProfileSetup.js

// Importa useState y useEffect desde React
import React, { useState, useEffect } from 'react'; // <--- AGREGAR useEffect AQUÍ
// import Header from '../components/Header'; // Ya no se importa aquí, se renderiza en App.js
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import './ProfileSetup.css'; // Importa los estilos para la página ProfileSetup

function ProfileSetup() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    bio: '',
    photos: [] // Array para URLs de fotos
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        // Asegúrate de que supabase.auth.user() es válido antes de usarlo.
        // Si el usuario no está autenticado aquí, esto fallará.
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          throw new Error("Usuario no autenticado para subir fotos.");
        }
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('avatars') // Asegúrate de que este bucket exista en Supabase Storage
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // data es metadata del archivo, no la URL pública directamente
        // Para obtener la URL pública, necesitas getPublicUrl
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      setProfile(prevProfile => ({
        ...prevProfile,
        photos: [...prevProfile.photos, ...uploadedUrls]
      }));
      setSuccess('Fotos cargadas.');
    } catch (err) {
      console.error('Error al subir fotos:', err);
      setError('Error al subir fotos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Asegúrate de que supabase.auth.user() es válido.
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
          throw new Error("Usuario no autenticado para guardar perfil.");
      }

      const { error } = await supabase
        .from('usuario') // Tu tabla 'usuario'
        .update({
          nombre: profile.name,
          // Guardar el año de nacimiento para calcular la edad después
          fecha_nacimiento: profile.age ? `${new Date().getFullYear() - parseInt(profile.age)}-01-01` : null, // Guarda el primer día del año de nacimiento
          biografia: profile.bio,
          multimedia: profile.photos // Guarda las URLs de las fotos
        })
        .eq('id', userId); // Actualiza el perfil del usuario actual

      if (error) throw error;

      setSuccess('Perfil actualizado con éxito!');
      setTimeout(() => navigate('/'), 1500); // Redirige al Dashboard

    } catch (err) {
      console.error('Error al guardar el perfil:', err.message);
      setError('Error al guardar el perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Opcional: Cargar perfil existente al cargar la página
  useEffect(() => { // <--- useEffect ahora está importado
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingProfile, error } = await supabase // Renombramos 'data' a 'existingProfile' para evitar 'data' no usada
        .from('usuario')
        .select('nombre, fecha_nacimiento, biografia, multimedia')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        console.error('Error al cargar perfil existente:', error.message);
        setError('Error al cargar perfil existente.');
        return;
      }

      if (existingProfile) { // Usamos 'existingProfile' aquí
        setProfile({
          name: existingProfile.nombre || '',
          age: existingProfile.fecha_nacimiento ? (new Date().getFullYear() - new Date(existingProfile.fecha_nacimiento).getFullYear()).toString() : '',
          bio: existingProfile.biografia || '',
          photos: existingProfile.multimedia || []
        });
      }
    };
    fetchProfile();
  }, []); // Se ejecuta una vez al montar el componente

  return (
    <div className="profile-setup-container">
      {/* <Header />  <--- ELIMINAR O COMENTAR ESTA LÍNEA */}
      <main className="profile-setup-content">
        <h1>Configura tu Perfil</h1>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="age">Edad:</label>
            <input
              type="number"
              id="age"
              name="age"
              value={profile.age}
              onChange={handleChange}
              placeholder="Tu edad"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Biografía:</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Cuéntanos algo sobre ti..."
              rows="4"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="photos">Fotos:</label>
            <input
              type="file"
              id="photos"
              name="photos"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <div className="photo-previews">
              {profile.photos.map((photoUrl, index) => (
                <img key={index} src={photoUrl} alt={`Foto ${index + 1}`} className="photo-preview" />
              ))}
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default ProfileSetup;