import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import Settings from './pages/Settings/Settings.jsx'
import Finance from './pages/Finance/Finance.jsx'
import Academic from './pages/Academic/Academic.jsx'
import RegisterSchool from './pages/RegisterSchool/RegisterSchool.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-school" element={<RegisterSchool />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/academic" element={<Academic />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
