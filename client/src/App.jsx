import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Siderail from './components/Siderail.jsx'
import Home from './pages/Home.jsx'
import NewsPage from './pages/NewsPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ArticleDetail from './pages/ArticleDetail.jsx'
import ArticleEditor from './pages/ArticleEditor.jsx'
import ProjectEditor from './pages/ProjectEditor.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { getAuth, clearAuth } from './utils/auth.js'

export default function App() {
  const [auth, setAuth] = useState(getAuth())

  useEffect(() => {
    const handler = () => setAuth(getAuth())
    window.addEventListener('auth-changed', handler)
    return () => window.removeEventListener('auth-changed', handler)
  }, [])

  function handleLogout() {
    clearAuth()
    setAuth(null)
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Siderail auth={auth} />
        <div className="content">
          <main className="container main-area">
            <Routes>
              <Route path="/" element={<Home auth={auth} />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/projects" element={<ProjectsPage auth={auth} />} />
              <Route path="/projects/:id" element={<ProjectDetail auth={auth} />} />
              <Route path="/articles/new" element={<ArticleEditor auth={auth} />} />
              <Route path="/articles/:id" element={<ArticleDetail auth={auth} />} />
              <Route path="/articles/:id/edit" element={<ArticleEditor auth={auth} />} />
              <Route path="/projects/new" element={<ProjectEditor auth={auth} />} />
              <Route path="/projects/:id/edit" element={<ProjectEditor auth={auth} />} />
              <Route
                path="/login"
                element={<LoginPage onLogin={(a) => setAuth(getAuth())} />}
              />
              <Route
                path="/profile"
                element={<ProfilePage auth={auth} onLogout={handleLogout} />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
