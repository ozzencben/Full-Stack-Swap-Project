import { useContext, useState } from "react";
import AuthContext from "../../context/auth/AuthContext";
import "./SignIn.css";

const SignIn = ({ onClose }) => {
  const { login, navigate } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(identifier, password);
      onClose(); // Başarılı girişte modal kapanır
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="sign-in-container">
      <h2>Sign In</h2>
      <button className="close-btn" onClick={onClose}>
        X
      </button>
      <form onSubmit={handleLogin}>
        <input
          placeholder="Email or username"
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          placeholder="Password"
        />
        <button className="sign-in-btn" type="submit">
          Sign In
        </button>
      </form>
      <div className="sign-in-prompt">
        Don't have an account?{" "}
        <span onClick={() => navigate("/register")}>Sign up</span>
      </div>
    </div>
  );
};

export default SignIn;
