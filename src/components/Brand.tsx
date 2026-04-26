import logo from "@/assets/safestock-logo.png";

interface BrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: "h-14 w-14", title: "text-xl", tag: "text-[10px]" },
  md: { img: "h-24 w-24", title: "text-3xl", tag: "text-xs" },
  lg: { img: "h-40 w-40", title: "text-5xl", tag: "text-sm" },
  xl: { img: "h-56 w-56 md:h-64 md:w-64", title: "text-6xl md:text-7xl", tag: "text-base" },
};

export const Brand = ({ size = "lg", showTagline = true, className = "" }: BrandProps) => {
  const s = sizes[size];
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <img
        src={logo}
        alt="SafeStock logo"
        width={768}
        height={768}
        className={`${s.img} object-contain`}
      />
      <h2 className={`${s.title} font-bold tracking-tight text-primary mt-2`}>
        SAFE STOCK
      </h2>
      {showTagline && (
        <div className="mt-1 text-primary">
          <p className={`${s.tag} font-bold tracking-widest`}>SISTEMA DE GERENCIAMENTO</p>
          <p className={`${s.tag} tracking-wider opacity-80 mt-0.5`}>
            EFICIÊNCIA · CONTROLE · ORGANIZAÇÃO
          </p>
        </div>
      )}
    </div>
  );
};
