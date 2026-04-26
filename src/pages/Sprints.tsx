import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import { Pencil, ChevronDown, MoreVertical, FilePlus, Plus, ArrowLeftRight, Users } from "lucide-react";
import { toast } from "sonner";

type ColumnKey = "todo" | "doing" | "review" | "done";
interface Card { id: string; title: string; column: ColumnKey; }

const COLUMNS: { key: ColumnKey; title: string }[] = [
  { key: "todo", title: "A fazer" },
  { key: "doing", title: "Em andamento" },
  { key: "review", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

const initialBacklog = Array.from({ length: 7 }).map((_, i) => `Tarefa ${i + 1}`);

const Sprints = () => {
  const [projectName, setProjectName] = useState("Meu projeto");
  const [editing, setEditing] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [backlog, setBacklog] = useState<string[]>(initialBacklog);

  const addCard = (column: ColumnKey) => {
    const title = prompt("Nome do cartão");
    if (!title?.trim()) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), title: title.trim(), column }]);
  };

  const moveCard = (id: string) => {
    setCards((c) =>
      c.map((card) => {
        if (card.id !== id) return card;
        const order: ColumnKey[] = ["todo", "doing", "review", "done"];
        const next = order[(order.indexOf(card.column) + 1) % order.length];
        return { ...card, column: next };
      })
    );
  };

  const addBacklog = () => {
    const t = prompt("Nova tarefa do backlog");
    if (!t?.trim()) return;
    setBacklog((b) => [...b, t.trim()]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Project bar */}
      <div className="bg-muted/70 border-b border-border px-4 md:px-8 py-3 flex items-center gap-3">
        {editing ? (
          <input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="bg-transparent text-xl font-bold outline-none border-b border-foreground/40"
          />
        ) : (
          <h1 className="text-xl md:text-2xl font-bold">{projectName}</h1>
        )}
        <button onClick={() => setEditing(true)} className="p-1 hover:bg-foreground/10 rounded active:scale-95 transition-transform" aria-label="Editar nome">
          <Pencil className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowBacklog((v) => !v)}
            className="p-1 hover:bg-foreground/10 rounded active:scale-95 transition-transform"
            aria-label="Alternar backlog"
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${showBacklog ? "" : "-rotate-90"}`} />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => toast("Membros do projeto", { description: "Convide colegas em breve" })}
            aria-label="Membros"
          >
            <Users className="h-4 w-4" />
          </button>
          <button className="p-1 hover:bg-foreground/10 rounded active:scale-95 transition-transform" aria-label="Mais opções">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6">
        {/* Columns */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col, i) => (
            <div
              key={col.key}
              style={{ animationDelay: `${i * 80}ms` }}
              className="ss-card p-4 animate-fade-up flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <div className="flex items-center gap-2 text-foreground/70">
                  <ArrowLeftRight className="h-4 w-4" />
                  <MoreVertical className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {cards.filter((c) => c.column === col.key).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => moveCard(c.id)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              <button
                onClick={() => addCard(col.key)}
                className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
              >
                <span>Adicionar um cartão</span>
                <FilePlus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Backlog */}
        {showBacklog && (
          <div className="ss-card p-5 mt-6 max-w-sm animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Backlog</h3>
              <button
                onClick={addBacklog}
                className="h-8 w-8 rounded-full border-2 border-foreground/80 flex items-center justify-center hover:bg-foreground/5 active:scale-95 transition-transform"
                aria-label="Adicionar tarefa"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {backlog.map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <span className="h-3 w-3 rounded-sm bg-foreground" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sprints;
