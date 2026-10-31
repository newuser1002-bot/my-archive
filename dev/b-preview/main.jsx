import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Demo, { SharedDemo } from './Demo';
import ArchiveBridgeProvider from '../../src/pages/b-shared/ArchiveBridgeProvider';
import { createHashRouter, RouterProvider } from 'react-router-dom';

const shared = new URLSearchParams(window.location.search).get('store') === 'shared';
const router = createHashRouter([{ path: '*', element: shared ? <ArchiveBridgeProvider><SharedDemo /></ArchiveBridgeProvider> : <Demo /> }]);
createRoot(document.getElementById('root')).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
