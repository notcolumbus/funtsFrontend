import { Navigate, Route, Routes } from 'react-router-dom'
import { Explorer } from './pages/Explorer'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Explorer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
