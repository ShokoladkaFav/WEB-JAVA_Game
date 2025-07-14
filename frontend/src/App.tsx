import './App.css'
import Header from './components/Header'
import MainSection from './components/MainSection'
import News from './pages/News'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import LobbyPage from './pages/LobbyPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<MainSection />} />
          <Route path="/news" element={<News />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/lobby/:sessionName" element={<LobbyPage />} /> {/* ✅ ПРАВИЛЬНО */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
