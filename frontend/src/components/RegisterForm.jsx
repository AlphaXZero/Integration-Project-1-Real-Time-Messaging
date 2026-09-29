import { useState } from "react";
import { register } from "../api/auth";
import "./RegisterForm.css";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    register(username, password)
      .then(data => console.log("Registered:", data))
      .catch(err => setError(err));
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">S'inscrire</button>
      {error && <p className="error">{JSON.stringify(error)}</p>}
    </form>
  );
}

export default RegisterForm;