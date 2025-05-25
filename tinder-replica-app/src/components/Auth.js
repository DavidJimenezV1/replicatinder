// src/components/Auth.js
import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Para alternar entre registro y login
  const navigate = useNavigate();

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Lógica de registro con Supabase Auth
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
          // Opcional: emailRedirectTo si quieres una URL específica de redirección post-confirmación
          // options: {
          //   emailRedirectTo: 'https://<tu-codespace-name>-3000.app.github.dev/'
          // }
        });

        if (error) {
          // Si el error es por email ya registrado
          if (error.message.includes("already registered")) {
              alert('Este email ya está registrado. Por favor, intenta iniciar sesión o usa otro email.');
          } else {
              throw error; // Propagar otros errores
          }
        } else {
          // Registro exitoso, pero el perfil no se inserta aquí.
          // Se insertará cuando el usuario confirme su email e inicie sesión (manejado en App.js).
          alert('¡Registro exitoso! Por favor, revisa tu email para confirmar tu cuenta. Una vez confirmada, inicia sesión.');
          setEmail(''); // Limpiar campos
          setPassword('');
          setIsSignUp(false); // Cambiar a la vista de login
        }
      } else {
        // Lógica de login
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;
        alert('Has iniciado sesión exitosamente!');
        // App.js se encargará de redirigir a / o /profile-setup
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isSignUp ? 'Regístrate' : 'Inicia Sesión'}</h2>
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {/* Opcional: Si quieres que nombre y fecha_nacimiento sean OBLIGATORIOS en el registro inicial,
            quítale los comentarios a estas secciones, pero asegúrate de que sean NOT NULL en la DB
            o de lo contrario, deja que se completen en ProfileSetup. */}
        {/* {isSignUp && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="nombre" style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
              <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="fechaNacimiento" style={{ display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento:</label>
              <input type="date" id="fechaNacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}/>
            </div>
          </>
        )} */}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Cargando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Ya tienes una cuenta? Inicia Sesión' : 'No tienes una cuenta? Regístrate'}
        </button>
      </p>
    </div>
  );
};

export default Auth;