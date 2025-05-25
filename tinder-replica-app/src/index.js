// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Asegúrate de que este archivo de estilos exista y/o sea correcto.
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom'; // <--- Importa BrowserRouter aquí

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* <--- Aquí envolvemos toda la App con el Router */}
      <App />
    </Router>
  </React.StrictMode>
);