import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Activation from './pages/Activation'
import Dashboard from './pages/Dashboard'
import Discover from './pages/Discover'
import IdeaLab from './pages/IdeaLab'
import Landing from './pages/Landing'
import Resources from './pages/Resources'
import Trunk from './pages/Trunk'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/idea-lab" element={<IdeaLab />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/activation" element={<Activation />} />
        <Route path="/trunk" element={<Trunk />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
