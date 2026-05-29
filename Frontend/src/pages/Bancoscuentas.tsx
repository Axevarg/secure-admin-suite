import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  X,
  ToggleLeft,
  ToggleRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

interface Cuenta {
  id: number;
  nombre: string;
  banco: string;
  numero_cuenta: string;
  clabe: string;
  saldo_inicial: number;
  activa: boolean;
  creador: string;
  created_at: string;
  total_ingresos: number;
  total_gastos: number;
  balance: number;
}

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const BANCOS = [
  "BBVA",
  "Banorte",
  "HSBC",
  "Santander",
  "Citibanamex",
  "Scotiabank",
  "Inbursa",
  "Bajío",
  "Azteca",
  "Otro",
];

export default function BancosCuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    banco: "",
    numero_cuenta: "",
    clabe: "",
    saldo_inicial: "",
  });

  const load = () => api.get("/bancos/cuentas").then((r) => setCuentas(r.data));

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.nombre || !form.banco)
      return alert("Nombre y banco son requeridos");
    setSaving(true);
    try {
      await api.post("/bancos/cuentas", {
        ...form,
        saldo_inicial: Number(form.saldo_inicial) || 0,
      });
      setOpenModal(false);
      setForm({
        nombre: "",
        banco: "",
        numero_cuenta: "",
        clabe: "",
        saldo_inicial: "",
      });
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: number) => {
    await api.patch(`/bancos/cuentas/${id}/toggle`);
    load();
  };

  const totalBalance = cuentas.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute right-0 top-0 w-40 h-40 bg-red-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex items-start gap-4">
          <button
            onClick={() => navigate("/bancos")}
            className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all group"
          >
            <ArrowLeft
              size={20}
              className="text-slate-700 group-hover:-translate-x-0.5 transition-transform"
              strokeWidth={2.5}
            />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/30">
                <Building2 size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">
                Cuentas <span className="text-red-600">Bancarias</span>
              </h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">
              {cuentas.filter((c) => c.activa).length} cuentas activas · Balance
              total:{" "}
              <span
                className={
                  totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
                }
              >
                ${fmt(totalBalance)}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Nueva Cuenta
        </button>
      </div>

      {/* GRID CUENTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cuentas.map((c) => (
          <div
            key={c.id}
            className={`relative bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
              c.activa ? "border-slate-100" : "border-slate-200 opacity-60"
            }`}
          >
            {/* TOP ACCENT */}
            <div
              className={`h-1.5 w-full ${c.activa ? "bg-red-600" : "bg-slate-300"}`}
            />

            <div className="p-7 space-y-5">
              {/* HEAD */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl ${c.activa ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <CreditCard
                      size={20}
                      className={c.activa ? "text-white" : "text-slate-400"}
                    />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">
                      {c.nombre}
                    </h2>
                    <p className="text-[10px] font-black text-red-600 uppercase mt-0.5">
                      {c.banco}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(c.id)}
                  title={c.activa ? "Desactivar" : "Activar"}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {c.activa ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} />
                  )}
                </button>
              </div>

              {/* DATOS BANCARIOS */}
              {(c.numero_cuenta || c.clabe) && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
                  {c.numero_cuenta && (
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Cuenta:{" "}
                      <span className="text-slate-600 font-mono">
                        {c.numero_cuenta}
                      </span>
                    </p>
                  )}
                  {c.clabe && (
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      CLABE:{" "}
                      <span className="text-slate-600 font-mono tracking-wider">
                        {c.clabe}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* STATS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <TrendingUp
                    size={12}
                    className="text-emerald-500 mx-auto mb-1"
                  />
                  <p className="text-[8px] font-black text-emerald-500 uppercase">
                    Ingresos
                  </p>
                  <p className="text-xs font-black text-emerald-700">
                    ${fmt(c.total_ingresos)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <TrendingDown
                    size={12}
                    className="text-red-500 mx-auto mb-1"
                  />
                  <p className="text-[8px] font-black text-red-500 uppercase">
                    Gastos
                  </p>
                  <p className="text-xs font-black text-red-700">
                    ${fmt(c.total_gastos)}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-3 text-center ${c.balance >= 0 ? "bg-blue-50" : "bg-amber-50"}`}
                >
                  <Wallet
                    size={12}
                    className={`mx-auto mb-1 ${c.balance >= 0 ? "text-blue-500" : "text-amber-500"}`}
                  />
                  <p
                    className={`text-[8px] font-black uppercase ${c.balance >= 0 ? "text-blue-500" : "text-amber-500"}`}
                  >
                    Balance
                  </p>
                  <p
                    className={`text-xs font-black ${c.balance >= 0 ? "text-blue-700" : "text-amber-700"}`}
                  >
                    ${fmt(c.balance)}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center pt-1">
                <p className="text-[8px] font-black text-slate-300 uppercase">
                  Saldo inicial: ${fmt(c.saldo_inicial)}
                </p>
                <span
                  className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                    c.activa
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          </div>
        ))}

        {cuentas.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-300">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-black text-[10px] uppercase tracking-widest">
              Sin cuentas registradas
            </p>
          </div>
        )}
      </div>

      {/* MODAL CREAR CUENTA */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpenModal(false)}
        >
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
              <div>
                <span className="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Nueva Cuenta
                </span>
                <h2 className="text-xl font-black uppercase tracking-tighter mt-2">
                  Registrar Cuenta{" "}
                  <span className="text-red-500">Bancaria</span>
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Nombre de la cuenta *
                </label>
                <Input
                  placeholder="Ej: BBVA Operativa Principal"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Banco *
                </label>
                <select
                  value={form.banco}
                  onChange={(e) => setForm({ ...form, banco: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-600/10"
                >
                  <option value="">Seleccionar banco...</option>
                  {BANCOS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Número de Cuenta
                  </label>
                  <Input
                    placeholder="Opcional"
                    value={form.numero_cuenta}
                    onChange={(e) =>
                      setForm({ ...form, numero_cuenta: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    CLABE
                  </label>
                  <Input
                    placeholder="18 dígitos"
                    maxLength={18}
                    value={form.clabe}
                    onChange={(e) =>
                      setForm({ ...form, clabe: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Saldo Inicial (MXN)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.saldo_inicial}
                  onChange={(e) =>
                    setForm({ ...form, saldo_inicial: e.target.value })
                  }
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
                />
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 font-black text-[10px] uppercase tracking-widest text-white transition-colors shadow-lg shadow-red-900/20"
              >
                {saving ? "Guardando..." : "Crear Cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
