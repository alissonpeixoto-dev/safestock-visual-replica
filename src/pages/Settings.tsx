import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import { Settings as SettingsIcon, User, Shield, Lock, Info, Phone, Check } from "lucide-react";
import { toast } from "sonner";

type Section = "perfil" | "seguranca" | "privacidade" | "sobre" | "suporte";

const tabs: { id: Section; label: string; icon: typeof User }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "privacidade", label: "Privacidade", icon: Lock },
  { id: "sobre", label: "Sobre", icon: Info },
  { id: "suporte", label: "Suporte", icon: Phone },
];

const Settings = () => {
  const [active, setActive] = useState<Section>("perfil");
  const [profile, setProfile] = useState({ name: "Usuário SafeStock", email: "usuario@safestock.app" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const ActiveIcon = tabs.find((t) => t.id === active)!.icon;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Perfil atualizado");
  };
  const savePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 6) return toast.error("Senha mínima de 6 caracteres");
    if (pwd.next !== pwd.confirm) return toast.error("As senhas não coincidem");
    toast.success("Senha alterada");
    setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom dark header for settings */}
      <header className="bg-header text-header-foreground px-4 md:px-8 py-4 flex items-center gap-3">
        <SettingsIcon className="h-6 w-6" strokeWidth={1.5} />
        <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
        <div className="ml-auto">
          <AppHeader />
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-[260px_1fr] gap-0">
        {/* Sidebar */}
        <aside className="bg-background px-4 md:px-6 py-6 md:border-r border-border">
          <ul className="space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setActive(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                      isActive ? "bg-secondary font-semibold" : "hover:bg-secondary/60"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                    <span>{t.label}</span>
                  </button>
                  <div className="border-b border-border/70 mx-3" />
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Content */}
        <section className="px-4 md:px-10 py-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-8 animate-fade-up">
            <ActiveIcon className="h-7 w-7" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold capitalize">{tabs.find((t) => t.id === active)!.label}</h2>
          </div>

          {active === "perfil" && (
            <form onSubmit={saveProfile} className="space-y-6 animate-fade-up">
              <Field label="Nome" desc="Como aparece para outros usuários">
                <input
                  className="ss-input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </Field>
              <Field label="E-mail" desc="Usado para login e notificações">
                <input
                  type="email"
                  className="ss-input"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </Field>
              <button className="ss-btn-primary max-w-xs">Salvar alterações</button>
            </form>
          )}

          {active === "seguranca" && (
            <form onSubmit={savePwd} className="space-y-6 animate-fade-up">
              <Field label="Senha atual" desc="Confirme sua identidade">
                <input type="password" className="ss-input" value={pwd.current}
                       onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
              </Field>
              <Field label="Nova senha" desc="Mínimo 6 caracteres">
                <input type="password" className="ss-input" value={pwd.next}
                       onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
              </Field>
              <Field label="Confirmar nova senha" desc="Repita a nova senha">
                <input type="password" className="ss-input" value={pwd.confirm}
                       onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </Field>
              <button className="ss-btn-primary max-w-xs">Alterar senha</button>
            </form>
          )}

          {active === "privacidade" && (
            <ul className="space-y-5 animate-fade-up">
              {["Compartilhar dados de uso", "Permitir cookies analíticos", "Mostrar perfil público", "Receber e-mails de marketing", "Exibir status online"].map((opt, i) => (
                <ToggleRow key={opt} label={`Opção ${i + 1}`} title={opt} />
              ))}
            </ul>
          )}

          {active === "sobre" && (
            <div className="space-y-4 animate-fade-up text-sm leading-relaxed">
              <p><strong>SafeStock</strong> é um sistema de gerenciamento focado em eficiência, controle e organização.</p>
              <p>Versão 1.0.0 · Build 2026.04</p>
              <p className="text-muted-foreground">© SafeStock — todos os direitos reservados.</p>
            </div>
          )}

          {active === "suporte" && (
            <div className="space-y-4 animate-fade-up">
              <Field label="Como podemos ajudar?" desc="Descreva sua dúvida ou problema">
                <textarea rows={5} className="ss-input rounded-2xl resize-none" placeholder="Sua mensagem..." />
              </Field>
              <button onClick={() => toast.success("Mensagem enviada")} className="ss-btn-primary max-w-xs">Enviar</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const Field = ({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Check className="h-4 w-4 text-accent" />
      <label className="text-base font-semibold">{label}</label>
    </div>
    <p className="text-xs text-muted-foreground mb-2 ml-6">{desc}</p>
    <div className="ml-6">{children}</div>
    <div className="border-b border-border/70 mt-4" />
  </div>
);

const ToggleRow = ({ label, title }: { label: string; title: string }) => {
  const [on, setOn] = useState(true);
  return (
    <li>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-accent" />
            <span className="font-semibold">{label}</span>
          </div>
          <p className="text-xs text-muted-foreground ml-6">{title}</p>
        </div>
        <button
          onClick={() => setOn((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-accent" : "bg-muted"}`}
          aria-pressed={on}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <div className="border-b border-border/70 mt-3" />
    </li>
  );
};

export default Settings;
