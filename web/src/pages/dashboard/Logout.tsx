import LoadingScreen from "components/LoadingScreen";
import { APP_NAME } from "config";
import useAuth from "hooks/useAuth";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const m = localStorage.getItem("m") || "";
      const p = localStorage.getItem("p") || "";
      const t = localStorage.getItem("t") || "";
      const l = localStorage.getItem("currentLanguage") || "zhs";
      localStorage.removeItem("theme");
      localStorage.removeItem("backgroundColor");
      await logout();
      localStorage.setItem("m", m);
      localStorage.setItem("p", p);
      localStorage.setItem("t", t);
      localStorage.setItem("currentLanguage", l);
      navigate("/authentication/login");
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>{APP_NAME}</title>
      </Helmet>
      <LoadingScreen />
    </>
  );
}
