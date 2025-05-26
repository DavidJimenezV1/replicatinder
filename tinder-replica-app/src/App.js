// src/App.js (Modificación: Añadir lógica de reintento para la creación de perfil)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client';

import Auth from './components/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Header from './components/Header';

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error al obtener la sesión:", error);
        setSession(null);
        return;
      }
      setSession(session);

      if (session) {
        const MAX_RETRIES = 3; // Número máximo de reintentos
        let currentRetries = 0;
        let profileCreated = false;

        while (currentRetries < MAX_RETRIES && !profileCreated) {
          try {
            const { data: profile, error: profileError, status } = await supabase
              .from('usuario')
              .select('id')
              .eq('id', session.user.id)
              .single();

            // Si el perfil no existe (status 406), intenta crearlo
            if (profileError && status === 406) {
              console.log(`Intento ${currentRetries + 1}: Perfil no encontrado, creando uno inicial...`);
              const { error: insertError } = await supabase.from('usuario').insert([
                {
                  id: session.user.id,
                  correo: session.user.email,
                  nombre: '',
                  fecha_nacimiento: new Date().toISOString().split('T')[0],
                  telefono: '',
                  roll: 'user',
                }
              ]);
              if (insertError) {
                console.error(`Error al insertar perfil inicial (intento ${currentRetries + 1}):`, insertError);
                // Si hay un error, incrementa reintentos y espera antes del próximo intento
                currentRetries++;
                await new Promise(res => setTimeout(res, 1000 * currentRetries)); // Espera más en cada reintento
              } else {
                console.log('Perfil inicial creado exitosamente.');
                profileCreated = true; // Marca como creado para salir del bucle
                navigate('/profile-setup'); // Redirige inmediatamente
              }
            } else if (profileError) {
              // Otros errores al verificar perfil (no solo el de no encontrado)
              console.error(`Error al verificar perfil existente (intento ${currentRetries + 1}):`, profileError);
              currentRetries++;
              await new Promise(res => setTimeout(res, 1000 * currentRetries));
            } else {
              // El perfil ya existe, no hay necesidad de crearlo
              profileCreated = true;
              console.log('Perfil ya existe, no se necesita crear.');
            }
          } catch (err) {
            console.error(`Error inesperado en lógica de perfil (intento ${currentRetries + 1}):`, err);
            currentRetries++;
            await new Promise(res => setTimeout(res, 1000 * currentRetries));
          }
        }

        // Si después de todos los reintentos el perfil no se pudo crear
        if (!profileCreated) {
          alert('Hubo un problema creando tu perfil después de varios intentos. Por favor, intenta iniciar sesión de nuevo o contacta a soporte.');
          await supabase.auth.signOut();
          setSession(null);
          navigate('/auth');
        }
      }
    };

    handleAuthSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_IN' && session) {
          // Si el evento es SIGNED_IN, pero no es la primera carga (ej. el usuario volvió de un tab, o solo inició sesión)
          // La lógica de App.js ya se encargará de verificar el perfil.
          // Solo llamamos a handleAuthSession si el usuario no tiene un perfil creado aún
          // (Esto es un poco redundante con la lógica de handleAuthSession, pero más seguro).
          // Para evitar llamadas duplicadas si el perfil ya está creado, handleAuthSession ya lo verifica.
          handleAuthSession();
        }
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="App">
      {session ? <Header /> : null}
      <Routes>
        <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/profile-setup" element={session ? <ProfileSetup /> : <Navigate to="/auth" replace />} />
        <Route path="/matches" element={session ? <Matches /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;