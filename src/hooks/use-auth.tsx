import { useContext } from "react";
import { AuthContext } from "./auth-context";

export { AuthProvider } from "./auth-provider";

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
