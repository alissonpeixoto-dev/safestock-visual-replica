import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, Store, X } from "lucide-react";
import { useState } from "react";
import { clearCurrentUser } from "@/lib/session";

export const AppHeader = ({ title }: { title?: string }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();

  const links = [
    { to: "/dashboard", label: "Meus projetos" },
    { to: "/configuracoes", label: "Configurações" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-header text-header-foreground">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 active:scale-95 transition-transform"
          aria-label="Início"
        >
          <Store className="h-6 w-6" strokeWidth={1.5} />
          {title && <span className="hidden sm:inline text-sm opacity-90">{title}</span>}
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/configuracoes"
            className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Perfil"
          >
            <User className="h-6 w-6" strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="absolute right-4 top-14 mt-2 w-56 ss-card bg-card text-foreground p-2 animate-fade-up">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm hover:bg-secondary transition-colors ${
                loc.pathname === l.to ? "bg-secondary font-semibold" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              clearCurrentUser();
              navigate("/");
            }}
            className="w-full text-left block px-4 py-3 rounded-xl text-sm hover:bg-destructive/10 text-destructive transition-colors"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  );
};
