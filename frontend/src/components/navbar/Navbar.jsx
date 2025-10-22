import { useContext, useState } from "react";
import { AiOutlineLogout } from "react-icons/ai";
import { CiUser } from "react-icons/ci";
import { IoAdd } from "react-icons/io5";
import AuthContext from "../../context/auth/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, navigate, logout } = useContext(AuthContext);
  const isAuthenticated = !!user;

  const [isOpen, setIsOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const toggleOpenMenu = () => {
    setIsOpen(!isOpen);
    setOverlayOpen(!overlayOpen);
  };

  const closeMenu = (path) => {
    setIsOpen(false);
    setOverlayOpen(false);

    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="nav-logo">
        <h2 onClick={() => closeMenu("/")}>SWAPIFY</h2>
      </div>
      {isAuthenticated && (
        <>
          <div className="hamburger">
            <label>
              <input
                type="checkbox"
                checked={isOpen}
                onChange={toggleOpenMenu}
              />
              <svg viewBox="0 0 32 32">
                <path
                  className="line line-top-bottom"
                  d="M27 10 13 10C10.8 10 9 8.2 9 6 
              9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26
              C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26
              25 23.8 23.2 22 21 22L7 22"
                ></path>
                <path className="line" d="M7 16 27 16"></path>
              </svg>
            </label>
          </div>
          <div
            className={`navbar-overlay ${overlayOpen ? "open" : ""}`}
            onClick={closeMenu}
          ></div>
          <div className={`menu ${isOpen ? "open" : ""}`}>
            <ul>
              <li onClick={() => closeMenu("/")}>Home</li>
              <li onClick={() => closeMenu("/my-profile")}>Profile</li>
              <li onClick={() => closeMenu("#")}>Settings</li>
              <li onClick={handleLogout}>Logout</li>
            </ul>
          </div>
        </>
      )}
      <div className="nav-buttons">
        {isAuthenticated ? (
          <>
            <div
              className="nav-button"
              onClick={() => closeMenu("/add-product")}
            >
              <IoAdd />
            </div>
            <div
              className="nav-button"
              onClick={() => closeMenu("/my-profile")}
            >
              <CiUser />
            </div>
            <div className="nav-button" onClick={handleLogout}>
              <AiOutlineLogout />
            </div>
          </>
        ) : (
          <>
            <button onClick={() => closeMenu("/login")} className="nav-button">
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
