import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CastMessage from './pages/CastMessage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cast" element={<CastMessage />} />
    </Routes>
  )
}

export default App 