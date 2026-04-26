import { AppHeader } from "@/components/AppHeader";
import { useState, DragEvent } from "react";
import { Pencil, ChevronDown, MoreVertical, FilePlus, Plus, ArrowLeftRight, Users, GripVertical } from "lucide-react";
import { toast } from "sonner";

type ColumnKey = "todo" | "doing" | "review" | "done";
interface Card { id: string; title: string; column: ColumnKey | "backlog"; }

const COLUMNS: { key: ColumnKey; title: string }[] = [
  { key: "todo", title: "A fazer" },
  { key: "doing", title: "Em andamento" },
  { key: "review", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

const initialBacklog: Card[] = Array.from({ length: 7 }).map((_, i) => ({
  id: `bk-${i + 1}`,
  title: `Tarefa ${i + 1}`,
  column: "backlog",
}));

const Sprints = () => {
  const [projectName, setProjectName] = useState("Meu projeto");
  const [editing, setEditing] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  const [cards, setCards] = useState<Card[]>(initialBacklog);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnKey | "backlog" | null>(null);

  const addCard = (column: ColumnKey) => {
    const title = prompt("Nome do cartão");
    if (!title?.trim()) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), title: title.trim(), column }]);
  };

  const addBacklog = () => {
    const t = prompt("Nova tarefa do backlog");
    if (!t?.trim()) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), title: t.trim(), column: "backlog" }]);
  };

  // Drag handlers
  const onDragStart = (e: DragEvent<HTMLElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setOverCol(null);
  };

  const onDragOver = (e: DragEvent<HTMLElement>, col: ColumnKey | "backlog") => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overCol !== col) setOverCol(col);
  };

  const onDragLeave = (col: ColumnKey | "backlog") => {
    setOverCol((c) => (c === col ? null : c));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, col: ColumnKey | "backlog") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    setCards((arr) => arr.map((c) => (c.id === id ? { ...c, column: col } : c)));
    setDraggingId(null);
    setOverCol(null);
  };

  const cardClass = (id: string) =>
    `group w-full text-left text-sm px-3 py-2 rounded-lg bg-background border border-border hover:border-accent transition-all cursor-grab active:cursor-grabbing flex items-center gap-2 ${
      draggingId === id ? "opacity-40" : ""
    }`;

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
          {COLUMNS.map((col, i) => {
            const colCards = cards.filter((c) => c.column === col.key);
            const isOver = overCol === col.key;
            return (
              <div
                key={col.key}
                style={{ animationDelay: `${i * 80}ms` }}
                onDragOver={(e) => onDragOver(e, col.key)}
                onDragLeave={() => onDragLeave(col.key)}
                onDrop={(e) => onDrop(e, col.key)}
                className={`ss-card p-4 animate-fade-up flex flex-col transition-colors ${
                  isOver ? "bg-accent/15 border-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <ArrowLeftRight className="h-4 w-4" />
                    <MoreVertical className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2 mb-3 min-h-[40px]">
                  {colCards.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, c.id)}
                      onDragEnd={onDragEnd}
                      className={cardClass(c.id)}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="flex-1">{c.title}</span>
                    </div>
                  ))}
                  {isOver && colCards.length === 0 && (
                    <div className="border-2 border-dashed border-accent/60 rounded-lg py-3 text-center text-xs text-accent">
                      Solte aqui
                    </div>
                  )}
                </div>

                <button
                  onClick={() => addCard(col.key)}
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
                >
                  <span>Adicionar um cartão</span>
                  <FilePlus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Backlog */}
        {showBacklog && (
          <div
            onDragOver={(e) => onDragOver(e, "backlog")}
            onDragLeave={() => onDragLeave("backlog")}
            onDrop={(e) => onDrop(e, "backlog")}
            className={`ss-card p-5 mt-6 max-w-sm animate-fade-up transition-colors ${
              overCol === "backlog" ? "bg-accent/15 border-accent" : ""
            }`}
          >
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
              {cards.filter((c) => c.column === "backlog").map((c) => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, c.id)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 text-sm px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-foreground/5 ${
                    draggingId === c.id ? "opacity-40" : ""
                  }`}
                >
                  <span className="h-3 w-3 rounded-sm bg-foreground shrink-0" />
                  <span className="flex-1">{c.title}</span>
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                </li>
              ))}
              {overCol === "backlog" && (
                <li className="border-2 border-dashed border-accent/60 rounded-lg py-2 text-center text-xs text-accent">
                  Solte aqui
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sprints;
