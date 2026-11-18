
import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

import { auth } from "./firebase";

export default function Auth({ role, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getErrorMessage = (error) => {
    switch (error.code) {
      case "auth/invalid-credential":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/weak-password":
        return "Please choose a stronger password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/network-request-failed":
        return "Please check your internet connection.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        setMessage("Login successful!");
      } else {
        const result =
          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        await updateProfile(result.user, {
          displayName: name.trim(),
        });

        setMessage("Account created successfully!");
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        "If your account exists, check your email for a password reset link."
      );
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#080b16] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white outline-none focus:border-violet-500 transition-all";

  return (
    <div className="min-h-screen bg-[#080b16] text-white flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background glow */}

      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-700/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}

      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Authentication card */}

      <div className="relative w-full max-w-md bg-[#111526]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">

        <div className="flex justify-center mb-5">
          <div className="bg-violet-600 p-4 rounded-2xl shadow-lg shadow-violet-600/30">
            <GraduationCap size={36} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center">
          CUB<span className="text-violet-400">IX</span>
        </h1>

        {role && (
          <p className="text-center text-violet-400 mt-2 capitalize">
            {role} workspace
          </p>
        )}

        <h2 className="text-2xl font-semibold text-center mt-6">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <p className="text-gray-400 text-center mt-2 mb-8">
          {isLogin
            ? "Continue your learning journey."
            : "Start your journey with CUBIX."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {!isLogin && (
            <div className="relative">
              <User
                className="absolute left-4 top-4 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputStyle}
              />
            </div>
          )}

          <div className="relative">
            <Mail
              className="absolute left-4 top-4 text-gray-400"
              size={20}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputStyle}
            />
          </div>

          <div className="relative">
            <Lock
              className="absolute left-4 top-4 text-gray-400"
              size={20}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? 1 : 8}
              className={inputStyle}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
              className="absolute right-4 top-4 text-gray-400"
            >
              {showPassword
                ? <EyeOff size={20} />
                : <Eye size={20} />}
            </button>
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                disabled={loading}
                onClick={handleForgotPassword}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}

            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-400 text-sm">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            disabled={loading}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="ml-2 text-violet-400 font-semibold hover:text-violet-300"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          Powered by Firebase Authentication
        </p>
      </div>
    </div>
  );
}
