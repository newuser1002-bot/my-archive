import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Demo, { SharedDemo } from './Demo';
import ArchiveBridgeProvider from '../../src/pages/b-shared/ArchiveBridgeProvider';

const shared = new URLSearchParams(window.location.search).get('store') === 'shared';
createRoot(document.getElementById('root')).render(<StrictMode>{shared ? <ArchiveBridgeProvider><SharedDemo /></ArchiveBridgeProvider> : <Demo />}</StrictMode>);
