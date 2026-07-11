import { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { MainDashboard } from './components/dashboard/MainDashboard'

function App() {
  const [username] = useState('Player')
  const [version] = useState('1.21.5')

  const launch = async () => {
    // @ts-ignore
    await window.api.launchGame({ username, version })
  }

  return (
    <div className="flex h-screen bg-gray-950 font-sans text-gray-200 overflow-hidden">
      <Sidebar />
      <MainDashboard onLaunch={launch} />
    </div>
  )
}

export default App
