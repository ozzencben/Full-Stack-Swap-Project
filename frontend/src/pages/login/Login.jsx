import { useContext, useState } from "react";
import { RiEye2Line, RiEyeCloseLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import Loader from "../../components/loader/Loader";
import AuthContext from "../../context/auth/AuthContext";
import "./Login.css";

const Login = () => {
  const { login } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(identifier, password);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const isFormValid = identifier && password;

  if (loading) return <Loader />;

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <div className="auth-form-item">
          <input
            placeholder="Username or Email"
            onChange={(e) => setIdentifier(e.target.value)}
            value={identifier}
          />
        </div>

        <div className="auth-form-item">
          <input
            placeholder="Username or Email"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            name="password"
            type={showPassword ? "text" : "password"}
          />
          {showPassword ? (
            <RiEye2Line onClick={toggleShowPassword} />
          ) : (
            <RiEyeCloseLine onClick={toggleShowPassword} />
          )}
        </div>

        <div className="auth-form-item">
          <button disabled={!isFormValid} type="submit">
            Login
          </button>
        </div>
      </form>

      <div className="auth-prompt">
        <p>Don't have an account?</p>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
