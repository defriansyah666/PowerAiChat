import ChatBox from './components/ChatBox';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Power AI Chatbox</h1>
        <ChatBox />
      </div>
      
      <footer className="w-full text-center p-4 mt-auto text-white">
        <p>&copy; 2025 Power AI Defriansyah. All rights reserved.</p>
      </footer>
    </main>
  );
}
