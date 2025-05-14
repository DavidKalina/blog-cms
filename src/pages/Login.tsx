import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useSupabase } from "../contexts/AuthContext";
import { BookOpen } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const supabase = useSupabase();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/95 dark:to-zinc-900/95">
      <div className="relative border-b border-zinc-100 dark:border-zinc-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
                <BookOpen className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h1 className="font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Welcome Back
              </h1>
              <p className="font-mono text-zinc-600 dark:text-zinc-400">
                Sign in to access your blog dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg font-mono text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/50 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/50 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
