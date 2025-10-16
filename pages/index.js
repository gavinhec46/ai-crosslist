// pages/index.js
import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Welcome to AI CrossList!");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <Head>
        <title>AI CrossList</title>
        <meta
          name="description"
          content="AI-powered crosslisting and reselling workflow tool"
        />
      </Head>

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🚀 AI CrossList</h1>
        <p className="text-lg text-gray-600">
          Manage, list, and automate your reselling workflow.
        </p>
      </header>

      {/* Main Section */}
      <main className="bg-white rounded-2xl shadow p-8 max-w-lg w-full text-center">
        <p className="text-gray-700 mb-4">{message}</p>

        <button
          onClick={() =>
            setMessage("Ready to build your AI-powered listing workflow!")
          }
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
        >
          Get Started
        </button>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} gkidstec — All rights reserved.
      </footer>
    </div>
  );
}