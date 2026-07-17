import { useNavigate } from "react-router";
import { Music } from "lucide-react";

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6">
        <Music size={28} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        Page not found
      </h1>
      <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => nav("/artists")}
        className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
        Back to Artists
      </button>
    </div>
  );
}
