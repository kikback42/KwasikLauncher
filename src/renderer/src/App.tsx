import { Sidebar } from './components/layout/Sidebar'
import { ViewSwitcher } from './components/layout/ViewSwitcher'

function App() {
  return (
    <div className="flex w-full h-screen bg-gray-950 font-sans text-gray-200 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        <ViewSwitcher />
      </main>
    </div>
  )
}

export default App
