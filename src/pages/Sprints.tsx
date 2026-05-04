import { AppHeader } from "@/components/AppHeader";
import { useState, DragEvent, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { Pencil, ChevronDown, MoreVertical, Plus, Users, GripVertical, X, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  cardsStorageKey,
  projectNameStorageKey,
  projectsStorageKey,
} from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

type ColumnKey = "todo" | "doing" | "review" | "done" | "backlog";
interface Card { id: string; title: string; description?: string; column: ColumnKey; }

const COLUMNS: { key: Exclude<ColumnKey, "backlog">; title: string }[] = [
  { key: "todo", title: "A fazer" },
  { key: "doing", title: "Em andamento" },
  { key: "review", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

const ALL_STATUS: { key: ColumnKey; title: string }[] = [
  { key: "backlog", title: "Backlog" },
  ...COLUMNS,
];

const loadCards = (pid: string | undefined): Card[] => {
  try {
    const raw = localStorage.getItem(cardsStorageKey(pid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const ProjectSprints = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  // Garante sessão Supabase antes de ler/gravar
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        navigate("/auth", { replace: true });
        return;
      }
      setCards(loadCards(projectId));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate, projectId]);

  const initialName =
    (location.state as { name?: string } | null)?.name ??
    localStorage.getItem(projectNameStorageKey(projectId)) ??
    "Meu projeto";

  const [projectName, setProjectName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnKey | null>(null);

  // Persist
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(cardsStorageKey(projectId), JSON.stringify(cards));
  }, [cards, projectId, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(projectNameStorageKey(projectId), projectName);
    // Atualiza nome no índice de projetos do usuário atual
    try {
      const raw = localStorage.getItem(projectsStorageKey());
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const next = arr.map((p: any) => p.id === projectId ? { ...p, name: projectName } : p);
          localStorage.setItem(projectsStorageKey(), JSON.stringify(next));
        }
      }
    } catch {}
  }, [projectName, projectId, ready]);

  // ---- Modal de edição de cartão ----
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
    if (!title) { setFormErr({ title: "O título é obrigatório" }); return; }
    if (title.length > 120) { setFormErr({ title: "Máximo 120 caracteres" }); return; }
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

  // ---- Modal de criação ----
  const [createCol, setCreateCol] = useState<ColumnKey | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newErr, setNewErr] = useState("");

  const openCreate = (col: ColumnKey) => {
    setCreateCol(col);
    setNewTitle("");
    setNewErr("");
  };

  const submitCreate = () => {
    const t = newTitle.trim();
    if (!t) { setNewErr("Informe um título"); return; }
    if (!createCol) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), title: t.slice(0, 120), column: createCol }]);
    toast.success("Cartão criado");
    setCreateCol(null);
  };

  const removeCard = (id: string) => setCards((c) => c.filter((x) => x.id !== id));

  // ---- Drag & Drop (com reordenação dentro da coluna) ----
  const onDragStart = (e: DragEvent<HTMLElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragEnd = () => { setDraggingId(null); setOverCol(null); };

  const onDragOverColumn = (e: DragEvent<HTMLElement>, col: ColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overCol !== col) setOverCol(col);
  };
  const onDragLeaveColumn = (col: ColumnKey) => setOverCol((c) => (c === col ? null : c));

  // Reordena/move o cartão `draggedId` para `targetCol` na posição `targetIndex`
  // (índice relativo aos cartões da coluna alvo, ignorando o próprio dragged)
  const moveCard = (draggedId: string, targetCol: ColumnKey, targetIndex: number) => {
    setCards((arr) => {
      const dragged = arr.find((c) => c.id === draggedId);
      if (!dragged) return arr;
      const without = arr.filter((c) => c.id !== draggedId);
      // localiza posição absoluta dentro do array global usando o N-ésimo cartão da coluna alvo
      const colCards = without.filter((c) => c.column === targetCol);
      const updated = { ...dragged, column: targetCol };
      let insertAt: number;
      if (targetIndex >= colCards.length) {
        // após o último cartão da coluna -> insere logo depois do último, ou no fim do array
        const last = colCards[colCards.length - 1];
        insertAt = last ? without.indexOf(last) + 1 : without.length;
      } else {
        const refCard = colCards[targetIndex];
        insertAt = without.indexOf(refCard);
      }
      return [...without.slice(0, insertAt), updated, ...without.slice(insertAt)];
    });
  };

  // Drop no container da coluna (final da lista)
  const onDropColumn = (e: DragEvent<HTMLElement>, col: ColumnKey) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const colCards = cards.filter((c) => c.column === col && c.id !== id);
    moveCard(id, col, colCards.length);
    setDraggingId(null);
    setOverCol(null);
  };

  // Drop sobre um cartão específico -> insere antes/depois conforme posição do mouse
  const onDropOnCard = (e: DragEvent<HTMLElement>, targetCard: Card) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id || id === targetCard.id) {
      setDraggingId(null);
      setOverCol(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;

    const colCardsWithout = cards.filter((c) => c.column === targetCard.column && c.id !== id);
    const refIdx = colCardsWithout.findIndex((c) => c.id === targetCard.id);
    const insertAt = refIdx + (isAfter ? 1 : 0);
    moveCard(id, targetCard.column, insertAt);
    setDraggingId(null);
    setOverCol(null);
  };

  const renderCard = (c: Card) => (
    <div
      key={c.id}
      draggable
      onDragStart={(e) => onDragStart(e, c.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => onDropOnCard(e, c)}
      onClick={() => openEdit(c.id)}
      className={`group relative w-full text-left text-[13px] px-2.5 py-2 rounded-md bg-card border border-border/80 shadow-sm hover:shadow-md hover:border-accent/70 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing flex items-start gap-1.5 ${
        draggingId === c.id ? "opacity-40 scale-[0.98]" : ""
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="break-words leading-snug font-medium text-foreground/90">{c.title}</p>
        {c.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {c.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 -mr-1">
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(c.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-accent rounded hover:bg-foreground/5"
          aria-label="Editar"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); removeCard(c.id); toast("Cartão excluído"); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive rounded hover:bg-foreground/5"
          aria-label="Excluir"
          title="Excluir"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Project bar */}
      <div className="bg-muted/70 border-b border-border px-4 md:px-8 py-3 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-1.5 rounded-full hover:bg-foreground/10 active:scale-95 transition-transform"
          aria-label="Voltar para projetos"
          title="Voltar para projetos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
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
          <h1 className="text-xl md:text-2xl font-bold truncate">{projectName}</h1>
        )}
        <button onClick={() => setEditing(true)} className="p-1 hover:bg-foreground/10 rounded active:scale-95 transition-transform" aria-label="Editar nome" title="Editar nome">
          <Pencil className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowBacklog((v) => !v)}
            className="p-1.5 hover:bg-foreground/10 rounded active:scale-95 transition-transform"
            aria-label="Alternar backlog"
            title={showBacklog ? "Ocultar backlog" : "Mostrar backlog"}
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${showBacklog ? "" : "-rotate-90"}`} />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => toast("Membros do projeto", { description: "Convide colegas em breve" })}
            aria-label="Membros"
            title="Membros"
          >
            <Users className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-foreground/10 rounded active:scale-95 transition-transform" aria-label="Mais opções" title="Mais opções">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 py-5">
        {/* Kanban: 4 colunas compactas, com scroll horizontal no mobile */}
        <div className="overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0">
          <div
            className="flex gap-4 mx-auto items-start"
            style={{ maxWidth: "1200px", minWidth: "fit-content" }}
          >
            {COLUMNS.map((col, i) => {
              const colCards = cards.filter((c) => c.column === col.key);
              const isOver = overCol === col.key;
              return (
                <div
                  key={col.key}
                  style={{ animationDelay: `${i * 80}ms`, flex: "1 1 0", minWidth: "250px", maxWidth: "300px" }}
                  onDragOver={(e) => onDragOverColumn(e, col.key)}
                  onDragLeave={() => onDragLeaveColumn(col.key)}
                  onDrop={(e) => onDropColumn(e, col.key)}
                  className={`ss-card p-3 animate-fade-up flex flex-col transition-colors ${
                    isOver ? "bg-accent/15 border-accent" : ""
                  }`}
                >
                  <div className="relative flex items-center justify-center mb-2.5 pb-2 border-b border-border/60">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-center text-foreground/85">
                      {col.title}
                      <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground/75">
                        {colCards.length}
                      </span>
                    </h3>
                  </div>

                  <div
                    className="space-y-1.5 mb-2 flex-1 overflow-y-auto pr-0.5"
                    style={{ maxHeight: "500px", minHeight: "120px" }}
                  >
                    {colCards.map(renderCard)}
                    {isOver && (
                      <div className="border-2 border-dashed border-accent/60 rounded-md py-3 text-center text-[11px] text-accent font-medium">
                        Solte aqui
                      </div>
                    )}
                    {!isOver && colCards.length === 0 && (
                      <p className="text-[11px] text-muted-foreground/60 text-center py-6">
                        Nenhum cartão
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => openCreate(col.key)}
                    className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-auto pt-1.5 px-1 rounded hover:bg-foreground/5"
                  >
                    <span>Adicionar um cartão</span>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {showBacklog && (
          <div
            onDragOver={(e) => onDragOverColumn(e, "backlog")}
            onDragLeave={() => onDragLeaveColumn("backlog")}
            onDrop={(e) => onDropColumn(e, "backlog")}
            className={`ss-card p-4 mt-5 mx-auto animate-fade-up transition-colors ${
              overCol === "backlog" ? "bg-accent/15 border-accent" : ""
            }`}
            style={{ maxWidth: "1200px" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">
                Backlog
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground/75 align-middle">
                  {cards.filter((c) => c.column === "backlog").length}
                </span>
              </h3>
              <button
                onClick={() => openCreate("backlog")}
                className="h-7 w-7 rounded-full border border-foreground/70 flex items-center justify-center hover:bg-foreground/5 active:scale-95 transition-transform"
                aria-label="Adicionar tarefa"
                title="Adicionar tarefa"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 min-h-[60px]">
              {cards.filter((c) => c.column === "backlog").map(renderCard)}
              {cards.filter((c) => c.column === "backlog").length === 0 && overCol !== "backlog" && (
                <p className="text-[11px] text-muted-foreground/60 text-center py-4">
                  Nenhuma tarefa no backlog
                </p>
              )}
              {overCol === "backlog" && (
                <div className="border-2 border-dashed border-accent/60 rounded-md py-2 text-center text-[11px] text-accent font-medium">
                  Solte aqui
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Modal criar cartão ===== */}
      <Dialog open={!!createCol} onOpenChange={(o) => !o && setCreateCol(null)}>
        <DialogContent className="sm:max-w-md ss-card border-2 border-foreground/90 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Novo cartão</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Adicionar em: <span className="font-semibold text-foreground">
                {ALL_STATUS.find((s) => s.key === createCol)?.title}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pl-1">
              Título <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => { setNewTitle(e.target.value); if (newErr) setNewErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitCreate(); } }}
              placeholder="Ex: Criar tela de login"
              maxLength={120}
              className="ss-input mt-1.5"
              aria-invalid={!!newErr}
            />
            {newErr && <p className="mt-1 text-xs text-destructive pl-2">{newErr}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateCol(null)}
              className="rounded-full border-2 border-foreground/80 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitCreate}
              className="rounded-full bg-accent text-accent-foreground font-medium px-6 py-2.5 text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[0_2px_0_0_hsl(var(--foreground)/0.9)]"
            >
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
