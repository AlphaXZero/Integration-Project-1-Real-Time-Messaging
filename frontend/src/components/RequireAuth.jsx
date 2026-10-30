import { Navigate } from "react-router";
import { isLoggedIn } from "../api/auth";

function RequireAuth({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default RequireAuth;