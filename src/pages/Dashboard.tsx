import { AppHeader } from "@/components/AppHeader";
import { MessageSquare, ArrowDownUp, Plus, Trash2, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  updatedAt: number;
}

const STORAGE_KEY = "safestock:projects";

const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatRelative = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} dia${d > 1 ? "s" : ""} atrás`;
  return new Date(ts).toLocaleDateString("pt-BR");
};

const Dashboard = () => {
  const [sortDesc, setSortDesc] = useState(true);
  const [items, setItems] = useState<Project[]>(loadProjects);

  // Modal criar/editar
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  // Modal confirmar exclusão
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => sortDesc ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
    [items, sortDesc]
  );

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setErr("");
    setOpenForm(true);
  };

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setErr("");
    setOpenForm(true);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr("Informe um nome"); return; }
    if (trimmed.length > 60) { setErr("Máximo 60 caracteres"); return; }

    if (editingId) {
      setItems((arr) => arr.map((p) => p.id === editingId ? { ...p, name: trimmed, updatedAt: Date.now() } : p));
      toast.success("Projeto atualizado");
    } else {
      const np: Project = { id: crypto.randomUUID(), name: trimmed, updatedAt: Date.now() };
      setItems((arr) => [np, ...arr]);
      toast.success("Projeto criado");
    }
    setOpenForm(false);
  };

  const removeProject = (id: string) => {
    setItems((arr) => arr.filter((p) => p.id !== id));
    try { localStorage.removeItem(`safestock:cards:${id}`); } catch {}
    toast("Projeto excluído");
    setConfirmId(null);
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
            <button onClick={openCreate} className="ss-btn-navy flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo projeto
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="ss-card p-10 text-center animate-fade-up">
            <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold mb-1">Nenhum projeto ainda</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Crie seu primeiro projeto para começar a organizar suas tarefas.
            </p>
            <button onClick={openCreate} className="ss-btn-navy inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Criar projeto
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="ss-card p-5 block animate-fade-up hover:-translate-y-0.5 transition-transform group relative"
              >
                <Link to={`/projetos/${p.id}`} state={{ name: p.name }} className="block">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-6">
                    <MessageSquare className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide mb-3 pr-16 break-words">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">Última atividade: {formatRelative(p.updatedAt)}</p>
                </Link>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); openEdit(p); }}
                    className="p-2 rounded-full hover:bg-foreground/10 active:scale-95 transition-transform"
                    aria-label="Editar projeto"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); setConfirmId(p.id); }}
                    className="p-2 rounded-full hover:bg-destructive/10 text-destructive active:scale-95 transition-transform"
                    aria-label="Excluir projeto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar projeto */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-md ss-card border-2 border-foreground/90 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingId ? "Editar projeto" : "Novo projeto"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Dê um nome claro e curto para o seu projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pl-1">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (err) setErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Ex: Site institucional"
              maxLength={60}
              className="ss-input mt-1.5"
              aria-invalid={!!err}
            />
            {err && <p className="mt-1 text-xs text-destructive pl-2">{err}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="rounded-full border-2 border-foreground/80 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-full bg-accent text-accent-foreground font-medium px-6 py-2.5 text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[0_2px_0_0_hsl(var(--foreground)/0.9)]"
            >
              {editingId ? "Salvar" : "Criar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="sm:max-w-md ss-card border-2 border-foreground/90 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Excluir projeto?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Essa ação não pode ser desfeita. Os cartões deste projeto também serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmId(null)}
              className="rounded-full border-2 border-foreground/80 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => confirmId && removeProject(confirmId)}
              className="rounded-full bg-destructive text-destructive-foreground font-medium px-6 py-2.5 text-sm hover:bg-destructive/90 active:scale-[0.98] transition-all"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
