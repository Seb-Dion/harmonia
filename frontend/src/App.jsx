import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import Profile from "./pages/Profile"
import LogAlbum from "./pages/LogAlbum"
import ListDetails from "./pages/ListDetails"
import Footer from './components/Footer';
import './styles/App.css';

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </>
  )
}

function App() {
  console.log('Rendering App with Footer');

  return (
    <div className="app-container">
      <BrowserRouter>
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-album"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LogAlbum />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists/:listId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ListDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<RegisterAndLogout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  )
}

export default App