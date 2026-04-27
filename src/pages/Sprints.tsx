import { AppHeader } from "@/components/AppHeader";
import { useState, DragEvent, useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { Pencil, ChevronDown, MoreVertical, Plus, Users, GripVertical, X, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type ColumnKey = "todo" | "doing" | "done" | "backlog";
interface Card { id: string; title: string; description?: string; column: ColumnKey; }

const COLUMNS: { key: Exclude<ColumnKey, "backlog">; title: string }[] = [
  { key: "todo", title: "A fazer" },
  { key: "doing", title: "Em andamento" },
  { key: "done", title: "Concluído" },
];

const ALL_STATUS: { key: ColumnKey; title: string }[] = [
  { key: "backlog", title: "Backlog" },
  ...COLUMNS,
];

const initialCards: Card[] = [
  { id: "1", title: "Configurar ambiente", column: "backlog" },
  { id: "2", title: "Modelar banco de dados", column: "backlog" },
  { id: "3", title: "Criar tela de login", column: "backlog" },
  { id: "4", title: "Definir rotas da API", column: "backlog" },
  { id: "5", title: "Escrever documentação", column: "backlog" },
];

const ProjectSprints = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const initialName = (location.state as { name?: string } | null)?.name ?? "Meu projeto";
  const [projectName, setProjectName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnKey | null>(null);

  // ---- Modal de edição ----
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; column: ColumnKey }>({
    title: "", description: "", column: "backlog",
  });
  const [formErr, setFormErr] = useState<{ title?: string }>({});
  const editingCard = cards.find((c) => c.id === editingCardId) || null;

  useEffect(() => {
    if (editingCard) {
      setForm({
        title: editingCard.title,
        description: editingCard.description ?? "",
        column: editingCard.column,
      });
      setFormErr({});
    }
  }, [editingCardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (id: string) => setEditingCardId(id);
  const closeEdit = () => setEditingCardId(null);

  const saveEdit = () => {
    const title = form.title.trim();
    if (!title) {
      setFormErr({ title: "O título é obrigatório" });
      return;
    }
    if (title.length > 120) {
      setFormErr({ title: "Máximo 120 caracteres" });
      return;
    }
    setCards((arr) =>
      arr.map((c) =>
        c.id === editingCardId
          ? { ...c, title, description: form.description.trim().slice(0, 1000), column: form.column }
          : c
      )
    );
    toast.success("Cartão atualizado");
    closeEdit();
  };

  const deleteFromModal = () => {
    if (!editingCardId) return;
    removeCard(editingCardId);
    toast("Cartão excluído");
    closeEdit();
  };

  const addCard = (column: ColumnKey) => {
    const title = prompt(column === "backlog" ? "Nova tarefa do backlog" : "Nome do cartão");
    if (!title?.trim()) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), title: title.trim().slice(0, 120), column }]);
  };

  const removeCard = (id: string) => setCards((c) => c.filter((x) => x.id !== id));

  // ---- Drag & Drop (HTML5 nativo) ----
  const onDragStart = (e: DragEvent<HTMLElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragEnd = () => { setDraggingId(null); setOverCol(null); };
  const onDragOver = (e: DragEvent<HTMLElement>, col: ColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overCol !== col) setOverCol(col);
  };
  const onDragLeave = (col: ColumnKey) => setOverCol((c) => (c === col ? null : c));
  const onDrop = (e: DragEvent<HTMLElement>, col: ColumnKey) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    setCards((arr) => arr.map((c) => (c.id === id ? { ...c, column: col } : c)));
    setDraggingId(null);
    setOverCol(null);
  };

  const renderCard = (c: Card) => (
    <div
      key={c.id}
      draggable
      onDragStart={(e) => onDragStart(e, c.id)}
      onDragEnd={onDragEnd}
      onClick={() => openEdit(c.id)}
      className={`group relative w-full text-left text-sm px-3 py-2 rounded-lg bg-background border border-border hover:border-accent transition-all cursor-grab active:cursor-grabbing flex items-center gap-2 ${
        draggingId === c.id ? "opacity-40 scale-[0.98]" : ""
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <span className="flex-1 break-words">
        {c.title}
        {c.description && (
          <span className="block text-[11px] text-muted-foreground/80 truncate mt-0.5">
            {c.description}
          </span>
        )}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); openEdit(c.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-accent rounded hover:bg-foreground/5"
        aria-label="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); removeCard(c.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive rounded hover:bg-foreground/5"
        aria-label="Remover"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

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
        {/* 3 Colunas */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                className={`ss-card p-4 animate-fade-up flex flex-col transition-colors min-h-[280px] ${
                  isOver ? "bg-accent/15 border-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    {col.title}{" "}
                    <span className="ml-1 text-xs text-muted-foreground">({colCards.length})</span>
                  </h3>
                  <MoreVertical className="h-4 w-4 text-foreground/70" />
                </div>

                <div className="space-y-2 mb-3 flex-1">
                  {colCards.map(renderCard)}
                  {isOver && (
                    <div className="border-2 border-dashed border-accent/60 rounded-lg py-3 text-center text-xs text-accent">
                      Solte aqui
                    </div>
                  )}
                  {!isOver && colCards.length === 0 && (
                    <p className="text-xs text-muted-foreground/70 text-center py-6">
                      Arraste cartões para cá
                    </p>
                  )}
                </div>

                <button
                  onClick={() => addCard(col.key)}
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
                >
                  <span>Adicionar um cartão</span>
                  <Plus className="h-4 w-4" />
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
            className={`ss-card p-5 mt-6 max-w-md animate-fade-up transition-colors ${
              overCol === "backlog" ? "bg-accent/15 border-accent" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                Backlog{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({cards.filter((c) => c.column === "backlog").length})
                </span>
              </h3>
              <button
                onClick={() => addCard("backlog")}
                className="h-8 w-8 rounded-full border-2 border-foreground/80 flex items-center justify-center hover:bg-foreground/5 active:scale-95 transition-transform"
                aria-label="Adicionar tarefa"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {cards.filter((c) => c.column === "backlog").map(renderCard)}
              {overCol === "backlog" && (
                <div className="border-2 border-dashed border-accent/60 rounded-lg py-2 text-center text-xs text-accent">
                  Solte aqui
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Modal de edição ===== */}
      <Dialog open={!!editingCardId} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="sm:max-w-lg ss-card border-2 border-foreground/90 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar cartão</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Atualize o título, descrição ou status da tarefa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pl-1">
                Título <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                value={form.title}
                maxLength={120}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  if (formErr.title) setFormErr({});
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                }}
                placeholder="Nome da tarefa"
                className="ss-input mt-1.5"
                aria-invalid={!!formErr.title}
              />
              {formErr.title && (
                <p className="mt-1 text-xs text-destructive pl-2">{formErr.title}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pl-1">
                Descrição
              </label>
              <textarea
                value={form.description}
                maxLength={1000}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes da tarefa (opcional)"
                rows={4}
                className="w-full mt-1.5 rounded-2xl border border-border bg-input px-5 py-3 text-sm
                           placeholder:text-muted-foreground/70 resize-none
                           focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent
                           transition-[box-shadow,border-color] duration-200"
              />
              <p className="text-[11px] text-muted-foreground/70 pl-2 mt-1">
                {form.description.length}/1000
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pl-1">
                Status
              </label>
              <Select
                value={form.column}
                onValueChange={(v) => setForm((f) => ({ ...f, column: v as ColumnKey }))}
              >
                <SelectTrigger className="ss-input mt-1.5 h-auto py-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={deleteFromModal}
              className="sm:mr-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-destructive/60 text-destructive px-5 py-2.5 text-sm font-medium hover:bg-destructive/10 active:scale-[0.98] transition-all"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-full border-2 border-foreground/80 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-full bg-accent text-accent-foreground font-medium px-6 py-2.5 text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[0_2px_0_0_hsl(var(--foreground)/0.9)]"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectSprints;
