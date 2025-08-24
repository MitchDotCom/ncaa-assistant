import Head from 'next/head';
import ChatWindow from '../components/ChatWindow';

export default function Home() {
  return (
    <>
      <Head>
        <title>NHL CBA Assistant</title>
      </Head>
      <main>
        <h1 style={{ textAlign: 'center' }}>Ask the NHL CBA Assistant</h1>
        <ChatWindow />
      </main>
    </>
  );
}
