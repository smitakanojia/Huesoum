import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/app.css'; // ported institutional design system (wins over Tailwind)
import './styles/react.css'; // supplemental styles for React-only classes
import 'maplibre-gl/dist/maplibre-gl.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
