// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase/client';

import Auth from './components/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Header from './components/Header'; // ¡Mantén esta importación!

import './App.css'; // Importa el CSS principal de la aplicación.

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
        const MAX_RETRIES = 3; 
        let currentRetries = 0;
        let profileFoundOrCreated = false; 

        while (currentRetries < MAX_RETRIES && !profileFoundOrCreated) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('usuario')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') { // Código de PostgREST para "no rows found for .single()"
              console.log(`Intento ${currentRetries + 1}: Perfil no encontrado, intentando crear uno inicial...`);
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
                if (insertError.code === '23505') { // Código de error de PostgreSQL para clave duplicada
                  console.log('Error 23505: El perfil con este ID/correo ya existe (conflicto). Asumiendo que el perfil está listo.');
                  profileFoundOrCreated = true; 
                } else {
                  console.error(`Error al insertar perfil inicial (intento ${currentRetries + 1}):`, insertError.message);
                  currentRetries++;
                  await new Promise(res => setTimeout(res, 1000 * currentRetries));
                }
              } else {
                console.log('Perfil inicial creado exitosamente.');
                profileFoundOrCreated = true;
                navigate('/profile-setup'); 
              }
            } else if (profileError) {
              console.error(`Error al verificar perfil existente (intento ${currentRetries + 1}):`, profileError.message);
              currentRetries++;
              await new Promise(res => setTimeout(res, 1000 * currentRetries));
            } else {
              profileFoundOrCreated = true;
              console.log('Perfil ya existe, no se necesita crear uno nuevo.');
            }
          } catch (err) {
            console.error(`Error inesperado en lógica de perfil (intento ${currentRetries + 1}):`, err.message);
            currentRetries++;
            await new Promise(res => setTimeout(res, 1000 * currentRetries));
          }
        }

        if (!profileFoundOrCreated) {
          alert('Hubo un problema verificando o creando tu perfil después de varios intentos. Por favor, intenta iniciar sesión de nuevo o contacta a soporte.');
          await supabase.auth.signOut();
          setSession(null);
          navigate('/auth');
        } else {
          // Si el perfil fue encontrado o creado, y el usuario está en la ruta de autenticación
          if (window.location.pathname === '/auth') { 
             navigate('/'); // Redirige al Dashboard
          }
        }
      }
    };

    handleAuthSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_IN' && session) {
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
      {session ? <Header /> : null} {/* ¡EL HEADER SOLO SE RENDERIZA AQUÍ! */}
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