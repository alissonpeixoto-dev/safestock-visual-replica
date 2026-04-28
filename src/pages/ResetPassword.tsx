import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ pw?: string; confirm?: string }>({});

  useEffect(() => {
    // Supabase troca o hash do link de recovery por uma sessão automaticamente.
    // Validamos que existe sessão ou um evento PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");
    const errs: typeof err = {};
    if (!password || password.length < 6) errs.pw = "Mínimo 6 caracteres";
    if (confirm !== password) errs.confirm = "As senhas não coincidem";
    setErr(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha redefinida com sucesso");
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-6">
        <Brand size="xl" />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Nova senha</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {ready
              ? "Defina sua nova senha para continuar."
              : "Validando seu link de redefinição..."}
          </p>
          <div className="space-y-4">
            <div className="relative">
              <input
                name="password"
                type={show ? "text" : "password"}
                placeholder="Nova senha"
                disabled={!ready}
                className="ss-input pr-12"
                aria-invalid={!!err.pw}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 active:scale-90 transition-all"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {err.pw && <p className="mt-1 text-xs text-destructive pl-2">{err.pw}</p>}
            </div>
            <div className="relative">
              <input
                name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirme a nova senha"
                disabled={!ready}
                className="ss-input pr-12"
                aria-invalid={!!err.confirm}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 active:scale-90 transition-all"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {err.confirm && <p className="mt-1 text-xs text-destructive pl-2">{err.confirm}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={!ready || loading}
            className="ss-btn-primary mt-8 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Redefinir senha
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
