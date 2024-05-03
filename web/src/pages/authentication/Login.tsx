import AuthButton from "components/authentication/AuthButton";
import Style from "components/Style";
import TextField from "components/TextField";
import { APP_NAME, FAKE_EMAIL } from "config";
import { useModal } from "contexts/ModalContext";
import { Formik } from "formik";
import useAuth from "hooks/useAuth";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {toast, ToastContainer} from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';

function Header() {
  return (
    <header className="w-full h-32 py-8 grid grid-cols-3">
      <div />
      <div className="flex items-center justify-center">
        {/* <img
          src="https://www.uteamwork.com/webmessenger/assets/images/web_messanger_logo.png"
          alt="logo"
          className="h-16 w-auto rounded-md"
        /> */}
      </div>
      <div className="flex text-sm flex-col justify-center items-end mr-6">
        {/* <div className="th-color-for">Don&apos;t have an account yet?</div>
        <Link
          to="/authentication/register"
          className="font-semibold th-color-blue"
        >
          Create an account
        </Link> */}
      </div>
    </header>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [queryParameters] = useSearchParams();
  const languages = {
    "simplified_chinese": "zhs",
    "traditional_chinese": "zht",
    "english": "en",
  };
  queryParameters.get("m") ? localStorage.setItem("m", queryParameters.get("m")) : localStorage.setItem("m", "");
  queryParameters.get("p") ? localStorage.setItem("p", queryParameters.get("p")) : localStorage.setItem("p", "");
  queryParameters.get("t") ? localStorage.setItem("t", queryParameters.get("t")) : localStorage.setItem("t", "");
  queryParameters.get("l") ? localStorage.setItem("currentLanguage", languages[queryParameters.get("l")]) : localStorage.setItem("currentLanguage", "");
  const email = queryParameters.get("m") ? queryParameters.get("m") : localStorage.getItem("m");
  const password = queryParameters.get("p") ? queryParameters.get("p") : localStorage.getItem("p");
  const {uteamworkUserData, setUteamworkUserData} = useModal();

  return (
    <div className="w-full h-screen bg-[percentage:100%]" style={{
      backgroundImage: `url(${
        `${process.env.PUBLIC_URL}/bg_siginin.png`
      })`,
    }}>
      <Style css={`
          input:-internal-autofill-selected {
            background-color: rgb(73, 80, 87) !important;
            color: rgb(173, 181, 189) !important;
          }
      `} />
      <Helmet>
        <title>{APP_NAME}</title>
      </Helmet>
      <div className="w-full flex items-center mx-auto h-full">
        <div className="w-[60%] h-full pl-[15%] pt-[7vw]">
          <div className="flex items-center pl-[10%] h-[5vw]">
            <img
              src="https://www.uteamwork.com/webmessenger/assets/images/web_messanger_logo.png"
              alt="logo"
              className="h-full w-auto rounded-md"
            />
            <h1 className="font-bold text-[3vw] text-black">Sign In</h1>
          </div>
          <Formik
            initialValues={{
              email,
              password,
              agree: false,
            }}
            onSubmit={async ({ email, password, agree }, { setSubmitting }) => {
              setSubmitting(true);
              try {
                let emailPayload = email;
                let passwordPayload = password;
                if (email === "" || password === "" || !agree) {
                  toast.error("Please input all fields", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                  });
                  return;
                }
                if (FAKE_EMAIL && !email.includes("@")) {
                  toast.error("Value is not valid", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                  });
                  return;
                }
                await login(emailPayload, passwordPayload);
                const response = await fetch("https://www.uteamwork.com/_api/annonymous/getUsers", {
                  method: 'POST',
                  headers: {
                    "Content-Type": "application/json",
                  }
                });
                const result = await response.json();
                console.log(result);
                if (result.result) {
                  setUteamworkUserData(result.result);
                } else {
                  setUteamworkUserData(null);
                }
                navigate("/dashboard");
              } catch (err: any) {
                if (err.message === "Cannot read properties of null (reading 'dataValues')") {
                  toast.error("User does not exist", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                  });
                } else {
                  toast.error("Singing in failed.", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                  });
                }
              }
              setSubmitting(false);
            }}
          >
            {({ values, handleChange, isSubmitting, handleSubmit }) => (
              <form className="max-w-md w-full mt-[1.5vw]" onSubmit={handleSubmit}>
                <div className="w-full">
                  <div className="p-[0.25vw]">
                    <input
                      type={FAKE_EMAIL ? "text" : "email"}
                      name="email"
                      id="email"
                      placeholder="name@email.com"
                      autoComplete="email"
                      value={values.email}
                      onChange={handleChange}
                      className="bg-[#495057] autofill:bg-[#495057] text-[#adb5bd] border-0 outline-0 mt-[0.5vw] px-4 h-[4vw] block w-full shadow-sm text-lg disabled:opacity-50 placeholder:text-[#adb5bd]"
                    />
                  </div>
                  <div className="p-[0.25vw]">
                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={values.password}
                      onChange={handleChange}
                      className="bg-[#495057] autofill:bg-[#495057] text-[#adb5bd] border-0 outline-0 my-[0.5vw] px-4 h-[4vw] block w-full shadow-sm text-lg disabled:opacity-50 placeholder:text-[#adb5bd]"
                    />
                  </div>
                  <div className="p-[0.25vw] flex items-center">
                    <input
                      value={values.agree}
                      type="checkbox"
                      name="agree"
                      id="agree"
                      required={!FAKE_EMAIL}
                      onChange={handleChange}
                      className="bg-[#495057] text-2xl w-6 h-6 border-0 outline-0 mr-2"
                    />
                    <div className="text-lg text-[#adb5bd]">I agree to the <a href="#" className="font-bold">Term of User</a></div>
                  </div>
                  <div className="pt-[1vw]">
                    <AuthButton text="Sign Me In" isSubmitting={isSubmitting} />
                  </div>
                </div>
              </form>
            )}
          </Formik>
        </div>
        <div className="w-[40%] h-full pt-[5vw]">
          <img className="w-full p-[0.5vw]" src={`${process.env.PUBLIC_URL}/img_signin.png`} alt="messenger" />
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
