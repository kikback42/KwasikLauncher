import { Sidebar } from './components/layout/Sidebar'
import { ViewSwitcher } from './components/layout/ViewSwitcher'

function App() {
  return (
    <div className="flex h-screen bg-gray-950 font-sans text-gray-200 overflow-hidden">
      <Sidebar />
      <ViewSwitcher />
    </div>
  )
}

export default App
