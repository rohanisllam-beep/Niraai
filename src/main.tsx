import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LivingConceptProvider } from './context/LivingConceptContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LivingConceptProvider>
      <App />
    </LivingConceptProvider>
  </StrictMode>,
);
