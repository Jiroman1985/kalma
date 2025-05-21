import { lazy, Suspense } from 'react';

// Usar React.lazy como alternativa a next/dynamic para cargar el componente de forma diferida
const ConversationsView = lazy(() => import('@/components/conversations/ConversationsView'));

export default function ConversationsPage() {
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Conversaciones</h1>
        <Suspense fallback={<div>Cargando...</div>}>
          <ConversationsView />
        </Suspense>
      </div>
    </>
  );
}
