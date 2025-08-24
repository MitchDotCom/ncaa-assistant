import Head from 'next/head';
import ChatWindow from '../components/ChatWindow';

export default function Home() {
  return (
    <>
      <Head>
        <title>NCAA Recruiting & Compliance Assistant</title>
      </Head>
      <main>
        <h1 style={{ textAlign: 'center' }}>Ask the NCAA Recruiting & Compliance Assistant</h1>
        <ChatWindow />
      </main>
    </>
  );
}
