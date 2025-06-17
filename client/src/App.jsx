import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Layout Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Page Components
import HomePage from "./pages/HomePage/HomePage";

import LoginPage from "./pages/Login_Register_Pages/LoginPage";
import RegisterPage from "./pages/Login_Register_Pages/RegisterPage";
import BookDetailsPage from "./pages/BookDetailPage/BookDetailsPage";
import AddBookPage from "./pages/AddBookPage/AddBookPage";
import EditBookPage from "./pages/EditBookPage/EditBookPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import MessagingPage from "./pages/Message/MessagingPage";
import ExchangePage from "./pages/ExchangePage/ExchangePage";
import AboutUs from "./pages/AboutUs/AboutUs";
import ResetPasswordPage from "./pages/Login_Register_Pages/ResetPassword";
// Context
import { AuthProvider } from "./context/AuthContext";
import { BooksProvider } from "./context/BooksContext";
import { ExchangeProvider } from "./context/ExchangeContext";
import { SocketProvider } from "./context/SocketContext/SocketContext";

// Add this component INSIDE your <Router>
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Instantly scrolls to top on route change
  }, [pathname]);

  return null; // This component doesn't render anything
}


// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  return token ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  // Request Notification Permission on App Load
useEffect(() => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted ✅");
      }
    });
  }
}, []);


  if (loading) {
    return (
      <div className="app-loader">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading BookBridge...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <BooksProvider>
          <ExchangeProvider>
            <Router>
              <ScrollToTop />
              <div className="app-container d-flex flex-column min-vh-100">
                <Header />
                <main className="flex-grow-1 py-4">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about-us" element={<AboutUs />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                      path="/reset-password/:token"
                      element={<ResetPasswordPage />}
                    />
                    <Route path="/books/:id" element={<BookDetailsPage />} />

                    <Route
                      path="/add-book"
                      element={
                        <PrivateRoute>
                          <AddBookPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/edit-book/:id"
                      element={
                        <PrivateRoute>
                          <EditBookPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <DashboardPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <ProfilePage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/messages/:exchangeId"
                      element={
                        <PrivateRoute>
                          <MessagingPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/exchanges/:id"
                      element={
                        <PrivateRoute>
                          <ExchangePage />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <ToastContainer position="bottom-right" autoClose={3000} />
              </div>
            </Router>
          </ExchangeProvider>
        </BooksProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
