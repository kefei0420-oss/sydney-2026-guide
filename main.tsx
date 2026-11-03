import React from 'react';
import { createRoot } from 'react-dom/client';
import { TranslationProvider } from './vendor/client/src/i18n';
import SharedTripPage from './vendor/client/src/pages/SharedTripPage';
import 'leaflet/dist/leaflet.css';
createRoot(document.getElementById('root')!).render(
  <TranslationProvider><SharedTripPage /></TranslationProvider>,
);
