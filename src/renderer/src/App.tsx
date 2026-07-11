import { useState } from 'react'

function App() {
  const [username, setUsername] = useState('Player')
  const [version] = useState('1.20.1')

  const launch = async () => {
    // @ts-ignore
    await window.api.launchGame({ username, version })
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">KwasikLauncher</h1>
      <input
        className="mb-4 p-2 bg-gray-800 rounded border border-gray-700 text-white"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <button
        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
        onClick={launch}
      >
        Играть
      </button>
    </div>
  )
}

export default App
