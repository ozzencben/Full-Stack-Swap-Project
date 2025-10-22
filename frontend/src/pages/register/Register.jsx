import { useContext, useState } from "react";
import { RiEye2Line, RiEyeCloseLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../../components/loader/Loader";
import AuthContext from "../../context/auth/AuthContext";
import { checkEmail, checkUsername } from "../../services/user";
import "./Register.css";

const Register = () => {
  const { register, navigate } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [passwordAgain, setPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowPasswordAgain = () =>
    setShowPasswordAgain(!showPasswordAgain);

  const handleChange = (e) => {
    if (e.target.name === "email") {
      try {
        checkEmail(e.target.value).then((res) => {
          setIsEmailAvailable(res.success);
        });
      } catch (error) {
        console.error(error);
      }
    }
    if (e.target.name === "username") {
      try {
        checkUsername(e.target.value).then((res) => {
          setIsUsernameAvailable(res.success);
        });
      } catch (error) {
        console.error(error);
      }
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (passwordAgain !== formData.password) {
      toast.error("Passwords do not match");
      return;
    }

    if (
      !formData.username ||
      !formData.firstname ||
      !formData.lastname ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Please enter all required fields");
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      setLoading(false);
      navigate("/login");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const isFormValid = Object.values(formData).every((value) => value !== "");

  if (loading) return <Loader />;

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <div
          className={`auth-form-item ${
            formData.username.length > 0 && !isUsernameAvailable ? "error" : ""
          }`}
        >
          <input
            placeholder="Username"
            name="username"
            onChange={handleChange}
            value={formData.username}
          />
        </div>

        <div className="auth-form-item">
          <input
            placeholder="First Name"
            name="firstname"
            onChange={handleChange}
            value={formData.firstname}
          />
        </div>

        <div className="auth-form-item">
          <input
            placeholder="Last Name"
            name="lastname"
            onChange={handleChange}
            value={formData.lastname}
          />
        </div>

        <div
          className={`auth-form-item ${
            formData.email.length > 0 && !isEmailAvailable ? "error" : ""
          }`}
        >
          <input
            placeholder="Email"
            name="email"
            onChange={handleChange}
            value={formData.email}
          />
        </div>

        <div className="auth-form-item">
          <input
            placeholder="Password"
            name="password"
            onChange={handleChange}
            value={formData.password}
            type={showPassword ? "text" : "password"}
          />
          {showPassword ? (
            <RiEye2Line onClick={toggleShowPassword} />
          ) : (
            <RiEyeCloseLine onClick={toggleShowPassword} />
          )}
        </div>

        <div className="auth-form-item">
          <input
            placeholder="Password Again"
            onChange={(e) => setPasswordAgain(e.target.value)}
            value={passwordAgain}
            type={showPasswordAgain ? "text" : "password"}
          />
          {showPasswordAgain ? (
            <RiEye2Line onClick={toggleShowPasswordAgain} />
          ) : (
            <RiEyeCloseLine onClick={toggleShowPasswordAgain} />
          )}
        </div>

        <div className="auth-form-item">
          <button disabled={!isFormValid} type="submit">
            register
          </button>
        </div>
      </form>

      <div className="auth-prompt">
        <p>
          Already have an account? <Link to="/login">Login</Link>{" "}
        </p>
      </div>
    </div>
  );
};

export default Register;
