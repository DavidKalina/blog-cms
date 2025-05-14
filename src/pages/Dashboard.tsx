import { Badge } from "../components/ui/badge";
import { BookOpen, Clock, MessageSquare, Plus } from "lucide-react";
import { Link } from "react-router-dom";

// Temporary mock data - replace with actual data fetching
const mockPosts = [
  {
    id: "1",
    title: "Getting Started with React",
    excerpt: "Learn the basics of React and how to build your first application...",
    category: "Web Development",
    status: "published",
    readTime: "5 min read",
    comments: 3,
    createdAt: "2024-03-20",
  },
  // Add more mock posts as needed
];

export function Dashboard() {
  return (
    <main className="min-h-screen pt-20 bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/95 dark:to-zinc-900/95">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-100 dark:border-zinc-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Blog Dashboard
            </h1>
            <p className="font-mono text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-8">
              Manage your blog posts, drafts, and published articles all in one place.
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <Plus size={16} />
              New Article
            </Link>
          </div>
        </div>
      </div>

      {/* Articles Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Grid Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Your Articles
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span className="font-mono">Sort by Date</span>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {mockPosts.length ? (
            mockPosts.map((post) => (
              <Link
                key={post.id}
                to={`/editor/${post.id}`}
                className="group block bg-white dark:bg-zinc-800 rounded-2xl lg:rounded-3xl 
                  border-2 border-zinc-100 dark:border-zinc-700/50 
                  hover:border-black dark:hover:border-white 
                  transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50
                  hover:-translate-y-1 hover:scale-[1.01] overflow-hidden"
              >
                <div className="relative h-full">
                  {/* Gradient Header */}
                  <div className="relative bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 p-6 lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.04),rgba(255,255,255,0))] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      {/* Status Badge */}
                      <Badge
                        className={`${
                          post.status === "published"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        } px-3 lg:px-4 py-2 rounded-full text-[10px] lg:text-xs font-mono mb-4`}
                      >
                        {post.status}
                      </Badge>

                      {/* Title */}
                      <h3 className="font-mono text-xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors duration-300">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="font-mono text-sm text-white/60 line-clamp-3">{post.excerpt}</p>
                    </div>
                  </div>

                  {/* Content Footer */}
                  <div className="p-6 lg:p-8 bg-white dark:bg-zinc-800">
                    <div className="space-y-6">
                      {/* Meta Information */}
                      <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span className="font-mono text-xs">{post.readTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={14} />
                          <span className="font-mono text-xs">{post.comments} comments</span>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        className="w-full text-left font-mono text-sm text-zinc-600 dark:text-zinc-300 
                          group-hover:text-[#333] dark:group-hover:text-white flex items-center justify-between"
                      >
                        <span>EDIT ARTICLE</span>
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-6">
                <BookOpen className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-200 mb-2">
                No Articles Yet
              </h3>
              <p className="font-mono text-zinc-600 dark:text-zinc-400 max-w-md">
                Start writing your first article by clicking the "New Article" button above!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
