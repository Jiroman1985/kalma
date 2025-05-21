import dynamic from 'next/dynamic';
import Head from 'next/head';

// Usar importación dinámica para evitar problemas de SSR con componentes que usan window
const ConversationsViewWithNoSSR = dynamic(
  () => import('@/components/conversations/ConversationsView'),
  { ssr: false }
);

export default function ConversationsPage() {
  return (
    <>
      <Head>
        <title>Conversaciones - Kalma</title>
        <meta name="description" content="Gestiona todas tus conversaciones desde Kalma" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Conversaciones</h1>
        <ConversationsViewWithNoSSR />
      </div>
    </>
  );
}
