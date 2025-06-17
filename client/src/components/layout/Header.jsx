import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import Notifications from "../../pages/Notifications";
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const navbarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setExpanded(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Navbar
      ref={navbarRef}
      collapseOnSelect
      expand="md"
      fixed="top"
      variant="dark"
      className="bg-primary shadow-sm"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="me-0 me-md-3" onClick={() => setExpanded(false)}>
          <i className="fa-solid fa-book-open me-2"></i> Book Exchange
        </Navbar.Brand>

        {/* Mobile elements container */}
        <div className="d-flex align-items-center ms-auto">
          {/* Mobile notification (left of toggler) */}
          {currentUser && (
            <div className="d-md-none mobile-notification">
              <Notifications />
            </div>
          )}
          <Navbar.Toggle aria-controls="responsive-navbar-nav" className="ms-2" />
        </div>

        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Home</Nav.Link>
            <Nav.Link as={Link} to="/about-us" onClick={() => setExpanded(false)}>About Us</Nav.Link>
          </Nav>

          <Nav className="align-items-center">
            {currentUser ? (
              <>
                {/* Desktop notification (right side) */}
                <div className="d-none d-md-flex notification-desktop me-3">
                  <Notifications />
                </div>

                <div className="d-none d-md-flex align-items-center">
                  <NavDropdown
                    title={
                      <>
                        <i className="fa-solid fa-user me-1"></i> My Account
                      </>
                    }
                    id="desktop-account-dropdown"
                  >
                    <NavDropdown.Item as={Link} to="/dashboard">
                      <i className="fa-solid fa-tachometer-alt me-2"></i> Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/profile">
                      <i className="fa-solid fa-user me-2"></i> Profile
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket me-2"></i> Logout
                    </NavDropdown.Item>
                  </NavDropdown>

                  <Button
                    onClick={handleLogout}
                    variant="danger"
                    className="ms-3"
                  >
                    Logout
                  </Button>
                </div>

                <div className="d-md-none">
                  <NavDropdown
                    title={
                      <>
                        <i className="fa-solid fa-user me-1"></i> My Account
                      </>
                    }
                    id="mobile-account-dropdown"
                    className="w-100 text-center"
                  >
                    <NavDropdown.Item as={Link} to="/dashboard" onClick={() => setExpanded(false)}>
                      <i className="fa-solid fa-tachometer-alt me-2"></i> Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                      <i className="fa-solid fa-user me-2"></i> Profile
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket me-2"></i> Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </div>
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-light"
                  className="me-2"
                  onClick={() => setExpanded(false)}
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="outline-light"
                  onClick={() => setExpanded(false)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;