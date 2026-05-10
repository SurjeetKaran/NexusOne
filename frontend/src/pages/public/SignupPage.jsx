import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API, { API_BASE_URL } from "../../api/axios";
import ParticlesBackground from "../../components/shared/ParticlesBackground";
import {
  CheckCircleIcon,
  SparklesIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ─── slide indices ────────────────────────────────────────────────────────────
const SLIDE_SOCIAL   = 0;  // Google / GitHub / skip
const SLIDE_NAME     = 1;  // full name
const SLIDE_DETAILS  = 2;  // email + password
const SLIDE_PLAN     = 3;  // trial vs free choice
const SLIDE_TRIAL    = 4;  // trial motivation (shown when user picks trial)
const SLIDE_FREE     = 5;  // free plan features (shown when user skips trial)
const SLIDE_DONE     = 6;  // submitting / done

const TOTAL_PROGRESS_STEPS = 4; // social → name → details → plan

// ─── helpers ─────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.8 3.4l6.6-6.6C35.8 2.2 30.5 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.7 6c1.8-5.5 7-9.7 13.7-9.7z"/>
    <path fill="#34A853" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.2H24v8.1h12.7c-.5 3.1-2 5.7-4.3 7.5l6.6 5.1c4-3.7 7.1-9.2 7.1-16.5z"/>
    <path fill="#4A90E2" d="M10.3 28.7C9.4 26.7 9 24.4 9 22s.4-4.7 1.3-6.7l-7.7-6C.7 13.2 0 17.4 0 22c0 4.6.7 8.8 2.6 12.8l7.7-6.1z"/>
    <path fill="#FBBC05" d="M24 44c6.5 0 11.8-2.1 15.7-5.8L33 33.1c-2.2 1.7-5 2.8-8 2.8-6.7 0-11.9-4.3-13.7-9.7l-7.7 6c4 7.8 12 13.2 20.4 13.2z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.73.084-.73 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.469-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const FREE_PERKS = [
  "10 new chats every day",
  "10 messages per conversation",
  "1 AI model at a time",
  "Both Study and Content modes",
  "Chat history for today",
  "Always free — no expiry",
];

const TRIAL_PERKS = [
  "10 new chats every day",
  "50 messages per conversation",
  "Use ALL AI models at once",
  "Both Study and Content modes",
  "Full NexusAI engine access",
  "Lasts 48 hours — just sign up and go",
];

// ─── slide animation variants ─────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function SignupPage() {
  const navigate = useNavigate();

  // form state
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Free"); // default Free

  // ui state
  const [slide, setSlide]   = useState(SLIDE_SOCIAL);
  const [dir, setDir]       = useState(1);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // ── navigation ──────────────────────────────────────────────────────────────
  const go = (target) => {
    setDir(target > slide ? 1 : -1);
    setError("");
    setSlide(target);
  };

  // ── social login ─────────────────────────────────────────────────────────────
  const handleSocial = (provider) => {
    const popup = window.open(
      `${API_BASE_URL}/auth/${provider}`,
      "authPopup",
      "width=500,height=600,left=200,top=100"
    );
    const listener = (event) => {
      if (event.data?.type === "SOCIAL_LOGIN_SUCCESS") {
        const { token, role, user } = event.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));
        window.removeEventListener("message", listener);
        navigate("/dashboard");
      }
    };
    window.addEventListener("message", listener);
  };

  // ── validate per slide ───────────────────────────────────────────────────────
  const validateAndNext = (from, to) => {
    if (from === SLIDE_NAME && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (from === SLIDE_DETAILS) {
      if (!email.trim()) { setError("Email is required."); return; }
      if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }
    go(to);
  };

  // ── plan choice ──────────────────────────────────────────────────────────────
  const chooseTrial = () => {
    setSelectedPlan("Trial");
    go(SLIDE_TRIAL);
  };

  const chooseFree = () => {
    setSelectedPlan("Free");
    go(SLIDE_FREE);
  };

  // ── final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
        selectedPlan,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "user");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || "Signup failed. Please try again.");
      go(SLIDE_DETAILS);
    } finally {
      setLoading(false);
    }
  };

  // ── progress bar (only for slides 0-3) ───────────────────────────────────────
  const progressStep = Math.min(slide, TOTAL_PROGRESS_STEPS);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-transparent overflow-hidden px-4 py-10">
      <ParticlesBackground />

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors group"
      >
        <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="panel-elevated rounded-3xl border border-line/80 shadow-electric overflow-hidden">

          {/* Progress bar — visible on slides 0–3 */}
          {slide <= SLIDE_PLAN && (
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-electric-500 rounded-full"
                animate={{ width: `${(progressStep / TOTAL_PROGRESS_STEPS) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          )}

          <div className="p-8">
            {/* Brand */}
            <div className="text-center mb-6">
              <span className="text-xl font-display font-bold bg-brand-main bg-clip-text text-transparent">
                NexusOne
              </span>
            </div>

            {/* Slides */}
            <div className="relative overflow-hidden min-h-[340px] flex flex-col justify-between">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={slide}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="w-full"
                >

                  {/* ── SLIDE 0: Social / Skip ─────────────────────────────── */}
                  {slide === SLIDE_SOCIAL && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <h2 className="text-2xl font-display font-bold text-white">Create your account</h2>
                        <p className="text-text-dim text-sm mt-1">Sign up in seconds — free to start, no payment needed.</p>
                      </div>

                      <button
                        onClick={() => handleSocial("google")}
                        className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </button>

                      <button
                        onClick={() => handleSocial("github")}
                        className="w-full py-3 bg-n800 text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-n700 transition border border-line"
                      >
                        <GitHubIcon />
                        Continue with GitHub
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-line/60" />
                        <span className="text-xs text-text-dim">or</span>
                        <div className="flex-1 h-px bg-line/60" />
                      </div>

                      <button
                        onClick={() => go(SLIDE_NAME)}
                        className="w-full py-3 rounded-xl border border-line text-text-mid hover:text-white hover:border-electric-500/50 transition text-sm font-medium"
                      >
                        Sign up with email instead
                      </button>

                      <p className="text-center text-xs text-text-dim">
                        Already have an account?{" "}
                        <Link to="/login" className="text-electric-400 hover:underline">Log in</Link>
                      </p>
                    </div>
                  )}

                  {/* ── SLIDE 1: Name ─────────────────────────────────────── */}
                  {slide === SLIDE_NAME && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-2xl font-display font-bold text-white">What's your name?</h2>
                        <p className="text-text-dim text-sm mt-1">This is how we'll greet you inside the app.</p>
                      </div>

                      <input
                        autoFocus
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && validateAndNext(SLIDE_NAME, SLIDE_DETAILS)}
                        className="w-full px-4 py-3 rounded-xl bg-n800/70 border border-line text-white placeholder-text-dim focus:ring-2 focus:ring-electric-500 outline-none transition"
                      />

                      {error && <p className="text-red-400 text-sm">{error}</p>}

                      <div className="flex gap-3">
                        <button onClick={() => go(SLIDE_SOCIAL)} className="p-3 rounded-xl border border-line text-text-dim hover:text-white transition">
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => validateAndNext(SLIDE_NAME, SLIDE_DETAILS)}
                          className="flex-1 py-3 btn-electric rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          Continue <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── SLIDE 2: Email + Password ─────────────────────────── */}
                  {slide === SLIDE_DETAILS && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-display font-bold text-white">Your login details</h2>
                        <p className="text-text-dim text-sm mt-1">You'll use these to log in every time.</p>
                      </div>

                      <input
                        autoFocus
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-n800/70 border border-line text-white placeholder-text-dim focus:ring-2 focus:ring-electric-500 outline-none transition"
                      />
                      <input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && validateAndNext(SLIDE_DETAILS, SLIDE_PLAN)}
                        className="w-full px-4 py-3 rounded-xl bg-n800/70 border border-line text-white placeholder-text-dim focus:ring-2 focus:ring-electric-500 outline-none transition"
                      />

                      {error && <p className="text-red-400 text-sm">{error}</p>}

                      <div className="flex gap-3">
                        <button onClick={() => go(SLIDE_NAME)} className="p-3 rounded-xl border border-line text-text-dim hover:text-white transition">
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => validateAndNext(SLIDE_DETAILS, SLIDE_PLAN)}
                          className="flex-1 py-3 btn-electric rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          Continue <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── SLIDE 3: Plan choice ──────────────────────────────── */}
                  {slide === SLIDE_PLAN && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-display font-bold text-white">How do you want to start?</h2>
                        <p className="text-text-dim text-sm mt-1">You can always upgrade later.</p>
                      </div>

                      {/* Trial option */}
                      <button
                        onClick={chooseTrial}
                        className="w-full p-4 rounded-2xl border border-electric-500/50 bg-electric-500/10 text-left hover:border-electric-500 transition group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-electric-400" />
                            Try the full platform free for 2 days
                          </span>
                          <span className="text-xs bg-cta-hot text-white px-2 py-0.5 rounded-full font-bold">Recommended</span>
                        </div>
                        <p className="text-sm text-text-dim">All models, 50 messages per chat. After 2 days you move to Free automatically.</p>
                      </button>

                      {/* Free option */}
                      <button
                        onClick={chooseFree}
                        className="w-full p-4 rounded-2xl border border-line text-left hover:border-white/20 transition"
                      >
                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-text-dim" />
                          Start on the Free plan
                        </div>
                        <p className="text-sm text-text-dim">10 chats a day, 10 messages per chat, 1 model at a time. Always free.</p>
                      </button>

                      <button onClick={() => go(SLIDE_DETAILS)} className="w-full text-center text-xs text-text-dim hover:text-white transition py-1">
                        ← Back
                      </button>
                    </div>
                  )}

                  {/* ── SLIDE 4: Trial motivation ─────────────────────────── */}
                  {slide === SLIDE_TRIAL && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full brand-badge text-xs font-semibold uppercase tracking-wider mb-3">
                          <ClockIcon className="w-4 h-4" />
                          2-Day Free Trial
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white">You're getting the full experience</h2>
                        <p className="text-text-dim text-sm mt-1">For 48 hours, nothing is locked. Use everything.</p>
                      </div>

                      <ul className="space-y-2">
                        {TRIAL_PERKS.map((p) => (
                          <li key={p} className="flex items-center gap-3 text-sm text-text-mid">
                            <CheckCircleIcon className="w-5 h-5 text-electric-400 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>

                      <div className="bg-electric-500/10 border border-electric-500/30 rounded-2xl p-3 text-xs text-electric-300 text-center">
                        After 2 days → Free plan kicks in automatically. Nothing gets deleted.
                      </div>

                      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 btn-electric rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {loading ? "Creating account…" : (
                          <><SparklesIcon className="w-5 h-5" /> Start my free trial</>
                        )}
                      </button>

                      <button onClick={() => go(SLIDE_PLAN)} className="w-full text-center text-xs text-text-dim hover:text-white transition py-1">
                        ← Change plan
                      </button>
                    </div>
                  )}

                  {/* ── SLIDE 5: Free plan features ───────────────────────── */}
                  {slide === SLIDE_FREE && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <h2 className="text-2xl font-display font-bold text-white">Here's what you get for free</h2>
                        <p className="text-text-dim text-sm mt-1">No expiry. No payment. Use it as long as you want.</p>
                      </div>

                      <ul className="space-y-2">
                        {FREE_PERKS.map((p) => (
                          <li key={p} className="flex items-center gap-3 text-sm text-text-mid">
                            <CheckCircleIcon className="w-5 h-5 text-text-dim shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>

                      <div className="bg-white/5 border border-line rounded-2xl p-3 text-xs text-text-dim text-center">
                        Want more? You can upgrade to Pro or Super anytime from your dashboard.
                      </div>

                      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 rounded-xl border border-line text-white font-bold text-base hover:border-electric-500/50 transition disabled:opacity-60"
                      >
                        {loading ? "Creating account…" : "Create my free account"}
                      </button>

                      <button onClick={() => go(SLIDE_PLAN)} className="w-full text-center text-xs text-text-dim hover:text-white transition py-1">
                        ← Change plan
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Step indicator dots — slides 0–3 */}
        {slide <= SLIDE_PLAN && (
          <div className="flex justify-center gap-2 mt-4">
            {[SLIDE_SOCIAL, SLIDE_NAME, SLIDE_DETAILS, SLIDE_PLAN].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slide === s ? "w-6 bg-electric-500" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
