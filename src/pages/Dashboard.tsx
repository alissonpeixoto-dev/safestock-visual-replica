import { AppHeader } from "@/components/AppHeader";
import { MessageSquare, ArrowDownUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

interface Project {
  id: string;
  name: string;
  lastActivity: string;
  updatedAt: number;
}

const seed: Project[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `p-${i + 1}`,
  name: i === 0 ? "Chat bot" : i === 1 ? "Painel financeiro" : i === 2 ? "Gestão de estoque" :
        i === 3 ? "Onboarding clientes" : i === 4 ? "Logística reversa" : i === 5 ? "Análise de vendas" :
        i === 6 ? "Auditoria interna" : i === 7 ? "Site institucional" : "App de campo",
  lastActivity: ["2 horas atrás", "Ontem", "3 dias atrás", "1 semana atrás", "5 horas atrás", "Hoje"][i % 6],
  updatedAt: Date.now() - i * 1000 * 60 * 60 * 3,
}));

const Dashboard = () => {
  const [sortDesc, setSortDesc] = useState(true);
  const [items, setItems] = useState(seed);

  const sorted = useMemo(
    () => [...items].sort((a, b) => sortDesc ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
    [items, sortDesc]
  );

  const addProject = () => {
    const n = items.length + 1;
    setItems([{ id: `p-${n}`, name: `Novo projeto ${n}`, lastActivity: "agora", updatedAt: Date.now() }, ...items]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 px-4 md:px-10 py-8 md:py-10 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
          <h1 className="text-3xl md:text-4xl font-bold">Meus projetos</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortDesc((s) => !s)}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
              aria-label="Reordenar"
              title={sortDesc ? "Mais recentes" : "Mais antigos"}
            >
              <ArrowDownUp className="h-5 w-5" />
            </button>
            <button onClick={addProject} className="ss-btn-navy flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo projeto
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p, i) => (
            <Link
              key={p.id}
              to={`/projetos/${p.id}`}
              state={{ name: p.name }}
              style={{ animationDelay: `${i * 60}ms` }}
              className="ss-card p-5 block animate-fade-up hover:-translate-y-0.5 transition-transform"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-6">
                <MessageSquare className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide mb-3">{p.name}</h3>
              <p className="text-xs text-muted-foreground">Última atividade: {p.lastActivity}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
