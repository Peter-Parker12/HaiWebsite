import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireSponsor, RequireUser, Shell } from './components/Shell'
import Activation from './pages/Activation'
import Catalogue from './pages/Catalogue'
import Discover from './pages/Discover'
import Home from './pages/Home'
import IdeaLab from './pages/IdeaLab'
import Login from './pages/Login'
import Marketplace from './pages/Marketplace'
import MyProjects from './pages/MyProjects'
import Overview from './pages/Overview'
import Pricing from './pages/Pricing'
import Profile from './pages/Profile'
import ProjectDetail from './pages/ProjectDetail'
import Register from './pages/Register'
import Resources from './pages/Resources'
import { SponsorAccount, SponsorInvestments, SponsorWatchlist } from './pages/SponsorPages'
import { SponsorLogin, SponsorRegister } from './pages/SponsorAuth'
import Trunk from './pages/Trunk'
import Workspace from './pages/Workspace'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/sponsor/login" element={<SponsorLogin />} />
      <Route path="/sponsor/register" element={<SponsorRegister />} />

      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route element={<RequireUser />}>
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/account" element={<Profile />} />
          <Route path="/my-projects/:id" element={<Workspace />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="idea-lab" element={<IdeaLab />} />
            <Route path="resources" element={<Resources />} />
            <Route path="discover" element={<Discover />} />
            <Route path="funding" element={<Marketplace />} />
            <Route path="activation" element={<Activation />} />
            <Route path="archive" element={<Trunk />} />
          </Route>
        </Route>

        <Route element={<RequireSponsor />}>
          <Route path="/sponsor/investments" element={<SponsorInvestments />} />
          <Route path="/sponsor/watchlist" element={<SponsorWatchlist />} />
          <Route path="/sponsor/account" element={<SponsorAccount />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
