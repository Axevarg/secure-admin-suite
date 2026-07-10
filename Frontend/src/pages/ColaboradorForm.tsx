import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  CreditCard,
  Phone,
  Camera,
} from "lucide-react";

interface Departamento {
  id: number;
  nombre: string;
}

interface Puesto {
  id: number;
  nombre: string;
}

interface Horario {
  dia_semana: string;
  hora_entrada: string;
  hora_salida: string;
}

const STEPS = [
  { key: "personal", label: "Datos Personales", icon: <User size={16} /> },
  { key: "laboral", label: "Datos Laborales", icon: <Briefcase size={16} /> },
  { key: "pago", label: "Datos de Pago", icon: <CreditCard size={16} /> },
  { key: "emergencia", label: "Emergencia", icon: <Phone size={16} /> },
];

const BANCOS = [
  "BBVA",
  "Banorte",
  "HSBC",
  "Santander",
  "Citibanamex",
  "Scotiabank",
  "Inbursa",
  "Bajío",
  "Banco Azteca",
  "Otro",
];

const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
      {label}
    </label>
    {children}
  </div>
);

const SI =
  "w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-600/10";

const II =
  "h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase";

export default function ColaboradorForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);

  const [horarios, setHorarios] = useState<Horario[]>(
    DIAS.map((d) => ({
      dia_semana: d,
      hora_entrada: "",
      hora_salida: "",
    })),
  );

  const [form, setForm] = useState({
    // PERSONAL
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",

    fecha_nacimiento: "",
    sexo: "",
    estado_civil: "",

    curp: "",
    rfc: "",
    nss: "",
    telefono: "",
    email: "",
    direccion: "",

    // LABORAL
    departamento_id: "",
    puesto_id: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],

    tipo_contrato: "",
    turno: "",

    // PAGO
    salario_diario: "",
    forma_pago: "",
    banco: "",
    clabe: "",
    numero_cuenta: "",

    // EMERGENCIA
    contacto_emergencia_nombre: "",
    contacto_emergencia_telefono: "",
    contacto_emergencia_relacion: "",
  });

  const set = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setHorario = (
    dia: string,
    field: "hora_entrada" | "hora_salida",
    value: string,
  ) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === dia
          ? {
              ...h,
              [field]: value,
            }
          : h,
      ),
    );
  };

  useEffect(() => {
    api
      .get("/colaboradores/catalogos/departamentos")
      .then((r) => setDepartamentos(r.data));
  }, []);

  useEffect(() => {
    if (!form.departamento_id) return;

    api
      .get(
        `/colaboradores/catalogos/puestos?departamento_id=${form.departamento_id}`,
      )
      .then((r) => setPuestos(r.data));
  }, [form.departamento_id]);

  useEffect(() => {
    if (!id) return;

    api.get(`/colaboradores/${id}`).then((r) => {
      const c = r.data.colaborador;

      setForm({
        nombre: c.nombre || "",
        apellido_paterno: c.apellido_paterno || "",
        apellido_materno: c.apellido_materno || "",

        fecha_nacimiento: c.fecha_nacimiento
          ? c.fecha_nacimiento.split("T")[0]
          : "",

        sexo: c.sexo || "",
        estado_civil: c.estado_civil || "",

        curp: c.curp || "",
        rfc: c.rfc || "",
        nss: c.nss || "",
        telefono: c.telefono || "",
        email: c.email || "",
        direccion: c.direccion || "",

        departamento_id: c.departamento_id
          ? String(c.departamento_id)
          : "",

        puesto_id: c.puesto_id
          ? String(c.puesto_id)
          : "",

        fecha_ingreso: c.fecha_ingreso
          ? c.fecha_ingreso.split("T")[0]
          : "",

        tipo_contrato: c.tipo_contrato || "",
        turno: c.turno || "",

        salario_diario: c.salario_diario
          ? String(c.salario_diario)
          : "",

        forma_pago: c.forma_pago || "",
        banco: c.banco || "",
        clabe: c.clabe || "",
        numero_cuenta: c.numero_cuenta || "",

        contacto_emergencia_nombre:
          c.contacto_emergencia_nombre || "",

        contacto_emergencia_telefono:
          c.contacto_emergencia_telefono || "",

        contacto_emergencia_relacion:
          c.contacto_emergencia_relacion || "",
      });

      if (r.data.horarios?.length) {
        setHorarios(
          DIAS.map((d) => {
            const h = r.data.horarios.find(
              (x: Horario) => x.dia_semana === d,
            );

            return {
              dia_semana: d,
              hora_entrada: h?.hora_entrada?.slice(0, 5) || "",
              hora_salida: h?.hora_salida?.slice(0, 5) || "",
            };
          }),
        );
      }

      if (c.foto_url) {
        setFotoPreview(
          `${import.meta.env.VITE_API_URL}${c.foto_url}`,
        );
      }
    });
  }, [id]);

  const handleFoto = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];

    if (!f) return;

    setFoto(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.nombre || !form.apellido_paterno) {
      return alert("Nombre y apellido son requeridos");
    }

    setSaving(true);

    try {
      const user = JSON.parse(
        sessionStorage.getItem("user") || "{}",
      );

      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });

      const horariosValidos = horarios.filter(
        (h) => h.hora_entrada && h.hora_salida,
      );

      fd.append(
        "horarios",
        JSON.stringify(horariosValidos),
      );

      fd.append("usuario_id", user.id ?? "");

      if (foto) {
        fd.append("foto", foto);
      }

      if (isEdit) {
        await api.put(`/colaboradores/${id}`, fd);
      } else {
        await api.post("/colaboradores", fd);
      }

      navigate("/colaboradores");
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] p-8 overflow-hidden text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #ef4444 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          <button
            onClick={() => navigate("/colaboradores")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 font-black text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Volver
          </button>

          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            {isEdit ? "Editar " : "Registrar "}
            <span className="text-red-400">
              Colaborador
            </span>
          </h1>

          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Completa los 4 pasos para registrar al colaborador
          </p>
        </div>
      </div>

      {/* STEPPER */}
      <div className="flex gap-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-3">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              i === step
                ? "bg-slate-900 text-white shadow-lg"
                : i < step
                  ? "bg-emerald-100 text-emerald-700 cursor-pointer"
                  : "text-slate-300 cursor-default"
            }`}
          >
            {i < step ? <Check size={14} /> : s.icon}

            <span className="hidden sm:inline">
              {s.label}
            </span>

            <span className="sm:hidden">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      {/* FORM */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        {/* ── PASO 1: PERSONAL ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1.5 h-6 bg-red-600 rounded-full" />
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Información Personal
              </h2>
            </div>

            {/* FOTO */}
            <div className="flex items-center gap-5 mb-2">
              <label className="cursor-pointer group">
                <div
                  className={`w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed transition-all ${
                    fotoPreview
                      ? "border-transparent"
                      : "border-slate-200 hover:border-red-400 bg-slate-50"
                  }`}
                >
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera
                      size={24}
                      className="text-slate-300 group-hover:text-red-400 transition-colors"
                    />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFoto}
                />
              </label>
              <div>
                <p className="font-black text-xs uppercase text-slate-700">
                  Foto del colaborador
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  Opcional · JPG o PNG
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nombre *">
                <Input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  className={II}
                  placeholder="Juan"
                />
              </Field>
              <Field label="Apellido Paterno *">
                <Input
                  value={form.apellido_paterno}
                  onChange={(e) => set("apellido_paterno", e.target.value)}
                  className={II}
                  placeholder="García"
                />
              </Field>
              <Field label="Apellido Materno">
                <Input
                  value={form.apellido_materno}
                  onChange={(e) => set("apellido_materno", e.target.value)}
                  className={II}
                  placeholder="López"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Fecha de Nacimiento">
                <Input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => set("fecha_nacimiento", e.target.value)}
                  className={II}
                />
              </Field>
              <Field label="Sexo">
                <select
                  value={form.sexo}
                  onChange={(e) => set("sexo", e.target.value)}
                  className={SI}
                >
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
              <Field label="Estado Civil">
                <select
                  value={form.estado_civil}
                  onChange={(e) => set("estado_civil", e.target.value)}
                  className={SI}
                >
                  <option value="">Seleccionar...</option>
                  {[
                    "Soltero",
                    "Casado",
                    "Unión libre",
                    "Divorciado",
                    "Viudo",
                  ].map((e) => (
                    <option key={e} value={e.toLowerCase()}>
                      {e}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="CURP">
                <Input
                  value={form.curp}
                  onChange={(e) => set("curp", e.target.value.toUpperCase())}
                  className={II}
                  placeholder="18 caracteres"
                  maxLength={18}
                />
              </Field>
              <Field label="RFC">
                <Input
                  value={form.rfc}
                  onChange={(e) => set("rfc", e.target.value.toUpperCase())}
                  className={II}
                  placeholder="13 caracteres"
                  maxLength={13}
                />
              </Field>
              <Field label="NSS">
                <Input
                  value={form.nss}
                  onChange={(e) => set("nss", e.target.value)}
                  className={II}
                  placeholder="11 dígitos"
                  maxLength={11}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Teléfono">
                <Input
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  className={II}
                  placeholder="10 dígitos"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={`${II} normal-case`}
                  placeholder="correo@ejemplo.com"
                />
              </Field>
            </div>

            <Field label="Dirección completa">
              <Input
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                className={II}
                placeholder="Calle, número, colonia, ciudad"
              />
            </Field>
          </div>
        )}

        {/* PASO 2 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1.5 h-6 bg-red-600 rounded-full" />

              <h2 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Información Laboral
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Departamento">
                <select
                  value={form.departamento_id}
                  onChange={(e) =>
                    set("departamento_id", e.target.value)
                  }
                  className={SI}
                >
                  <option value="">
                    Seleccionar...
                  </option>

                  {departamentos.map((d) => (
                    <option
                      key={d.id}
                      value={d.id}
                    >
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Puesto">
                <select
                  value={form.puesto_id}
                  onChange={(e) =>
                    set("puesto_id", e.target.value)
                  }
                  className={SI}
                  disabled={!form.departamento_id}
                >
                  <option value="">
                    Seleccionar...
                  </option>

                  {puestos.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Fecha de Ingreso">
                <Input
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={(e) =>
                    set("fecha_ingreso", e.target.value)
                  }
                  className={II}
                />
              </Field>

              <Field label="Tipo de Contrato">
                <select
                  value={form.tipo_contrato}
                  onChange={(e) =>
                    set("tipo_contrato", e.target.value)
                  }
                  className={SI}
                >
                  <option value="">
                    Seleccionar...
                  </option>

                  <option value="indefinido">
                    Indefinido
                  </option>

                  <option value="temporal">
                    Temporal
                  </option>

                  <option value="obra">
                    Por Obra
                  </option>

                  <option value="honorarios">
                    Honorarios
                  </option>

                  <option value="practicas">
                    Prácticas
                  </option>
                </select>
              </Field>

              <Field label="Turno">
                <select
                  value={form.turno}
                  onChange={(e) =>
                    set("turno", e.target.value)
                  }
                  className={SI}
                >
                  <option value="">
                    Seleccionar...
                  </option>

                  <option value="matutino">
                    Matutino
                  </option>

                  <option value="vespertino">
                    Vespertino
                  </option>

                  <option value="nocturno">
                    Nocturno
                  </option>

                  <option value="mixto">
                    Mixto
                  </option>
                </select>
              </Field>
            </div>

            {/* HORARIOS */}
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Horarios Semanales
                </p>
              </div>

              <div className="space-y-3">
                {horarios.map((h) => (
                  <div
                    key={h.dia_semana}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <div className="flex items-center">
                      <p className="font-black text-xs uppercase text-slate-600">
                        {h.dia_semana}
                      </p>
                    </div>

                    <Field label="Hora Entrada">
                      <Input
                        type="time"
                        value={h.hora_entrada}
                        onChange={(e) =>
                          setHorario(
                            h.dia_semana,
                            "hora_entrada",
                            e.target.value,
                          )
                        }
                        className={II}
                      />
                    </Field>

                    <Field label="Hora Salida">
                      <Input
                        type="time"
                        value={h.hora_salida}
                        onChange={(e) =>
                          setHorario(
                            h.dia_semana,
                            "hora_salida",
                            e.target.value,
                          )
                        }
                        className={II}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: PAGO ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1.5 h-6 bg-red-600 rounded-full" />
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Datos de Pago
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Salario Diario (MXN)">
                <Input
                  type="number"
                  value={form.salario_diario}
                  onChange={(e) => set("salario_diario", e.target.value)}
                  className={II}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Forma de Pago">
                <select
                  value={form.forma_pago}
                  onChange={(e) => set("forma_pago", e.target.value)}
                  className={SI}
                >
                  <option value="">Seleccionar...</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                </select>
              </Field>
            </div>

            {(form.forma_pago === "transferencia" ||
              form.forma_pago === "cheque") && (
              <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Banco">
                    <select
                      value={form.banco}
                      onChange={(e) => set("banco", e.target.value)}
                      className={SI}
                    >
                      <option value="">Seleccionar...</option>
                      {BANCOS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="CLABE (18 dígitos)">
                    <Input
                      value={form.clabe}
                      onChange={(e) => set("clabe", e.target.value)}
                      className={`${II} font-mono`}
                      placeholder="000000000000000000"
                      maxLength={18}
                    />
                  </Field>
                  <Field label="Número de Cuenta">
                    <Input
                      value={form.numero_cuenta}
                      onChange={(e) => set("numero_cuenta", e.target.value)}
                      className={`${II} font-mono`}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* PREVIEW SALARIO */}
            {form.salario_diario && (
              <div className="bg-slate-900 text-white rounded-2xl p-6 grid grid-cols-3 gap-4 text-center animate-in fade-in">
                {[
                  { label: "Diario", val: Number(form.salario_diario) },
                  { label: "Semanal", val: Number(form.salario_diario) * 6 },
                  {
                    label: "Mensual aprox.",
                    val: Number(form.salario_diario) * 24,
                  },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      {r.label}
                    </p>
                    <p className="text-xl font-black text-emerald-400 mt-1">
                      $
                      {r.val.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PASO 4: EMERGENCIA ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1.5 h-6 bg-red-600 rounded-full" />
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Contacto de Emergencia
              </h2>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Nombre completo">
                  <Input
                    value={form.contacto_emergencia_nombre}
                    onChange={(e) =>
                      set("contacto_emergencia_nombre", e.target.value)
                    }
                    className={II}
                    placeholder="Nombre del contacto"
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    value={form.contacto_emergencia_telefono}
                    onChange={(e) =>
                      set("contacto_emergencia_telefono", e.target.value)
                    }
                    className={II}
                    placeholder="10 dígitos"
                  />
                </Field>
                <Field label="Relación">
                  <select
                    value={form.contacto_emergencia_relacion}
                    onChange={(e) =>
                      set("contacto_emergencia_relacion", e.target.value)
                    }
                    className={SI}
                  >
                    <option value="">Seleccionar...</option>
                    {[
                      "Cónyuge",
                      "Padre",
                      "Madre",
                      "Hijo/a",
                      "Hermano/a",
                      "Amigo/a",
                      "Otro",
                    ].map((r) => (
                      <option key={r} value={r.toLowerCase()}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* RESUMEN ANTES DE GUARDAR */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Check size={12} className="text-emerald-500" /> Resumen del
                registro
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    label: "Nombre",
                    value: `${form.nombre} ${form.apellido_paterno}`,
                  },
                  { label: "CURP", value: form.curp || "—" },
                  { label: "Ingreso", value: form.fecha_ingreso },
                  { label: "Contrato", value: form.tipo_contrato || "—" },
                  {
                    label: "Salario diario",
                    value: form.salario_diario
                      ? `$${Number(form.salario_diario).toLocaleString("es-MX")}`
                      : "—",
                  },
                  { label: "Forma de pago", value: form.forma_pago || "—" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between py-1 border-b border-slate-100"
                  >
                    <span className="font-black text-slate-400 uppercase text-[9px]">
                      {r.label}
                    </span>
                    <span className="font-bold text-slate-700 uppercase text-[9px]">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={() =>
            step > 0
              ? setStep(step - 1)
              : navigate("/colaboradores")
          }
          className="h-14 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />

          {step > 0 ? "Anterior" : "Cancelar"}
        </button>

        <button
          onClick={() =>
            isLastStep
              ? handleSave()
              : setStep(step + 1)
          }
          disabled={saving}
          className="h-14 px-10 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest transition-colors shadow-xl shadow-red-900/20 flex items-center gap-2"
        >
          {saving ? (
            "Guardando..."
          ) : isLastStep ? (
            <>
              <Check size={16} />

              {isEdit
                ? "Guardar Cambios"
                : "Registrar Colaborador"}
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}