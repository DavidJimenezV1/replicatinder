// src/App.js
import React, { useState, useEffect } from 'react';
// SOLO importa Routes, Route, Navigate, y useNavigate. ¡NO BrowserRouter as Router aquí!
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client'; // Importa tu cliente Supabase

// Importa los componentes de tu aplicación
import Auth from './components/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Header from './components/Header'; // Para la barra de navegación

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate(); // Hook para navegar programáticamente

  useEffect(() => {
    // Función asíncrona para manejar la sesión y la creación/verificación del perfil
    const handleAuthSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error al obtener la sesión:", error);
        setSession(null);
        return;
      }
      setSession(session);

      // Si hay una sesión activa, verificar si el perfil existe en nuestra tabla 'usuario'
      if (session) {
        try {
          const { data: profile, error: profileError, status } = await supabase
            .from('usuario') // Tu tabla 'usuario'
            .select('id')
            .eq('id', session.user.id)
            .single();

          // PGRST116 (o status 406): No se encontraron filas (perfil no existe)
          if (profileError && status === 406) {
            console.log('Perfil no encontrado para el usuario, creando uno inicial...');
            const { error: insertError } = await supabase.from('usuario').insert([
              {
                id: session.user.id,
                correo: session.user.email,
                nombre: '', // Nombre por defecto vacío
                // >>>>>> LA LÍNEA MODIFICADA PARA FECHA DE NACIMIENTO <<<<<<
                fecha_nacimiento: new Date().toISOString().split('T')[0], // Esto inserta la fecha actual en formato 'YYYY-MM-DD'
                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                telefono: '', // Teléfono por defecto vacío
                roll: 'user', // Rol por defecto 'user'
                // updated_at: new Date(), // Si tu tabla 'usuario' tiene updated_at y no tiene un trigger, descomenta esto
              }
            ]);
            if (insertError) {
              console.error('Error al insertar perfil inicial:', insertError);
              alert('Hubo un problema creando tu perfil. Por favor, intenta de nuevo más tarde.');
              // Opcional: Cerrar sesión si el perfil no se puede crear
              await supabase.auth.signOut();
              setSession(null);
              navigate('/auth'); // Redirige al login
              return;
            }
            console.log('Perfil inicial creado exitosamente.');
            navigate('/profile-setup'); // Redirige al usuario para completar su perfil
          } else if (profileError) {
            console.error('Error al verificar perfil existente:', profileError);
            // Manejar otros errores de verificación de perfil que no sean "no encontrado"
          }
        } catch (err) {
            console.error("Error en la lógica de perfil en App.js:", err);
        }
      }
    };

    // Llama a la función al cargar el componente
    handleAuthSession();

    // Suscribirse a los cambios de autenticación para actualizar la sesión y manejar el perfil
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_IN' && session) {
          handleAuthSession(); // Vuelve a llamar para verificar/crear perfil al iniciar sesión
        }
        if (event === 'SIGNED_OUT') {
          navigate('/auth'); // Redirige al login al cerrar sesión
        }
      }
    );

    // Limpiar la suscripción al desmontar el componente
    return () => subscription.unsubscribe();
  }, [navigate]); // navigate es una dependencia para useEffect

  return (
    <div className="App">
      {/* Muestra la cabecera si hay una sesión activa */}
      {session ? <Header /> : null}

      {/* Definición de Rutas */}
      <Routes>
        {/* Ruta para autenticación: si ya hay sesión, redirige al Dashboard */}
        <Route
          path="/auth"
          element={!session ? <Auth /> : <Navigate to="/" />}
        />

        {/* Ruta principal (Dashboard/Swipes): si no hay sesión, redirige a /auth */}
        <Route
          path="/"
          element={session ? <Dashboard /> : <Navigate to="/auth" replace />}
        />

        {/* Ruta para configurar el perfil: si no hay sesión, redirige a /auth */}
        <Route
          path="/profile-setup"
          element={session ? <ProfileSetup /> : <Navigate to="/auth" replace />}
        />

        {/* Ruta para ver los matches: si no hay sesión, redirige a /auth */}
        <Route
          path="/matches"
          element={session ? <Matches /> : <Navigate to="/auth" replace />}
        />

        {/* Cualquier otra ruta no definida redirige a la principal */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;