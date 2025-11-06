import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Tipos
type Movimiento = {
  fecha: string; // YYYY-MM-DD
  categoria: string;
  tipo: "gasto" | "ingreso";
  descripcion: string;
  monto: number; // positivo
  metodo?: string;
  nota?: string;
};

type Periodo = "hoy" | "semana" | "mes" | "año" | "todo";

// Helper para filtrar por período
function inPeriodo(fechaISO: string, periodo: Periodo): boolean {
  const hoy = new Date();
  const f = new Date(fechaISO + "T00:00:00");
  const startOfDay = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  switch (periodo) {
    case "hoy":
      return f.getTime() >= startOfDay.getTime();
    case "semana": {
      const day = startOfDay.getDay(); // 0=Dom
      const mondayOffset = (day + 6) % 7; // convierte a 0=Lun
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - mondayOffset);
      return f >= startOfWeek && f <= hoy;
    }
    case "mes": {
      const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return f >= startOfMonth && f <= hoy;
    }
    case "año": {
      const startOfYear = new Date(hoy.getFullYear(), 0, 1);
      return f >= startOfYear && f <= hoy;
    }
    case "todo":
    default:
      return true;
  }
}

// Valida que una fecha ISO no sea futura (comparación local)
function isFutureISO(fechaISO: string): boolean {
  const f = new Date(fechaISO + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return f.getTime() > today.getTime();
}

// "Tests" simples para helpers (no cambian el UI)
(function runHelperTests() {
  try {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const todayISO = `${yyyy}-${mm}-${dd}`;

    console.assert(
      inPeriodo(todayISO, "hoy") === true,
      "inPeriodo hoy debería ser true"
    );

    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const ayerISO = `${ayer.getFullYear()}-${String(
      ayer.getMonth() + 1
    ).padStart(2, "0")}-${String(ayer.getDate()).padStart(2, "0")}`;
    console.assert(
      inPeriodo(ayerISO, "semana") === true,
      "inPeriodo semana debería incluir ayer"
    );

    const principioDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const principioISO = `${principioDeMes.getFullYear()}-${String(
      principioDeMes.getMonth() + 1
    ).padStart(2, "0")}-${String(principioDeMes.getDate()).padStart(2, "0")}`;
    console.assert(
      inPeriodo(principioISO, "mes") === true,
      "inPeriodo mes debería incluir el 1° del mes"
    );

    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const mananaISO = `${manana.getFullYear()}-${String(
      manana.getMonth() + 1
    ).padStart(2, "0")}-${String(manana.getDate()).padStart(2, "0")}`;
    console.assert(
      isFutureISO(mananaISO) === true,
      "isFutureISO debe ser true para mañana"
    );
    console.assert(
      isFutureISO(todayISO) === false,
      "isFutureISO debe ser false para hoy"
    );
  } catch (e) {
    console.error("Error en pruebas de helpers:", e);
  }
})();

export default function GestorGastosApp() {
  // Fecha de hoy en ISO (local)
  const todayISO = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  // Auth
  const [logged, setLogged] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [auth, setAuth] = useState({ nombre: "", email: "", password: "" });

  // UI
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [editarCuenta, setEditarCuenta] = useState(false);

  // User (se setea al loguear/registrar)
  const [user, setUser] = useState<{ nombre: string; email: string }>({
    nombre: "",
    email: "",
  });

  // Estado de movimientos (demo + nuevos)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([
    // Hoy (varios movimientos para probar)
    {
      fecha: todayISO,
      categoria: "Comida",
      tipo: "gasto",
      descripcion: "Desayuno",
      monto: 1500,
      metodo: "Efectivo",
      nota: "Café y medialunas",
    },
    {
      fecha: todayISO,
      categoria: "Transporte",
      tipo: "gasto",
      descripcion: "Colectivo",
      monto: 500,
      metodo: "Tarjeta SUBE",
      nota: "Ida al trabajo",
    },
    {
      fecha: todayISO,
      categoria: "Entretenimiento",
      tipo: "gasto",
      descripcion: "Spotify",
      monto: 900,
      metodo: "Crédito",
      nota: "Suscripción",
    },
    {
      fecha: todayISO,
      categoria: "Salario",
      tipo: "ingreso",
      descripcion: "Freelance",
      monto: 6000,
      metodo: "Transferencia",
      nota: "Landing page",
    },
    // Días previos
    {
      fecha: "2025-11-02",
      categoria: "Comida",
      tipo: "gasto",
      descripcion: "Almuerzo",
      monto: 2000,
      metodo: "Débito",
      nota: "Promo 2x1",
    },
    {
      fecha: "2025-11-01",
      categoria: "Salario",
      tipo: "ingreso",
      descripcion: "Sueldo",
      monto: 8000,
      metodo: "Transferencia",
      nota: "Depósito mensual",
    },
    {
      fecha: "2025-10-31",
      categoria: "Transporte",
      tipo: "gasto",
      descripcion: "Colectivo",
      monto: 1200,
      metodo: "Tarjeta SUBE",
      nota: "Recarga semanal",
    },
  ]);

  // Saldo inicial (puede venir de user settings)
  const [saldoInicial] = useState(25000);

  // Formulario agregar registro
  const [form, setForm] = useState({
    descripcion: "",
    monto: "",
    categoria: "Comida",
    fecha: todayISO,
    metodo: "Efectivo",
    nota: "",
  });

  // Toast simple
  const [toast, setToast] = useState<{
    show: boolean;
    text: string;
    tone: "ok" | "err";
  }>({
    show: false,
    text: "",
    tone: "ok",
  });

  // Totales por período (derivados)
  const movimientosFiltrados = useMemo(
    () => movimientos.filter((m) => inPeriodo(m.fecha, periodo)),
    [movimientos, periodo]
  );

  const totalIngresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => m.tipo === "ingreso")
        .reduce((acc, m) => acc + m.monto, 0),
    [movimientosFiltrados]
  );
  const totalGastos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => m.tipo === "gasto")
        .reduce((acc, m) => acc + m.monto, 0),
    [movimientosFiltrados]
  );

  const saldoActual = useMemo(() => {
    const ingresosAll = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((a, b) => a + b.monto, 0);
    const gastosAll = movimientos
      .filter((m) => m.tipo === "gasto")
      .reduce((a, b) => a + b.monto, 0);
    return saldoInicial + ingresosAll - gastosAll;
  }, [movimientos, saldoInicial]);

  // Datos para gráfica de categorías (solo gastos)
  const dataCategorias = useMemo(() => {
    const porCat: Record<string, number> = {};
    movimientosFiltrados.forEach((m) => {
      if (m.tipo === "gasto")
        porCat[m.categoria] = (porCat[m.categoria] || 0) + m.monto;
    });
    const entries = Object.entries(porCat).map(([name, value]) => ({
      name,
      value,
    }));
    return entries.length ? entries : [{ name: "Sin gastos", value: 1 }];
  }, [movimientosFiltrados]);

  const COLORS = [
    "#34d399",
    "#10b981",
    "#f87171",
    "#60a5fa",
    "#fbbf24",
    "#a78bfa",
  ]; // tailwind palette

  // Guardar registro (gasto o ingreso)
  function guardarRegistro(forceTipo?: "gasto" | "ingreso") {
    const useTipo = forceTipo ?? tipo;
    const montoNum = Number(form.monto);

    if (!form.descripcion.trim() || !montoNum || !form.fecha) {
      setToast({
        show: true,
        text: "Completá descripción, monto y fecha.",
        tone: "err",
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
      return;
    }
    if (isFutureISO(form.fecha)) {
      setToast({
        show: true,
        text: "La fecha no puede ser futura.",
        tone: "err",
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
      return;
    }

    const nuevo: Movimiento = {
      fecha: form.fecha,
      categoria: form.categoria,
      tipo: useTipo,
      descripcion: form.descripcion.trim(),
      monto: Math.abs(montoNum),
      metodo: form.metodo.trim() || undefined,
      nota: form.nota.trim() || undefined,
    };

    setMovimientos((prev) => [nuevo, ...prev]);
    setForm({
      descripcion: "",
      monto: "",
      categoria: "Comida",
      fecha: todayISO,
      metodo: "Efectivo",
      nota: "",
    });
    setToast({
      show: true,
      text: useTipo === "gasto" ? "Gasto guardado" : "Ingreso guardado",
      tone: "ok",
    });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  }

  // ------- UI de Login / Registro -------
  if (!logged) {
    return (
      <div className="min-h-dvh w-full grid place-items-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
        <div className="w-full max-w-md mx-auto">
          <Card className="w-full bg-gray-900/80 border-white/10 shadow-2xl backdrop-blur">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Marca */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 grid place-items-center text-emerald-300 font-bold">
                  $
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
                    Gestor de Gastos
                  </h1>
                  <p className="text-xs text-white/50">
                    Controlá tus finanzas de forma simple
                  </p>
                </div>
              </div>

              {/* Tabs Login / Registro */}
              <div className="grid grid-cols-2 rounded-lg bg-gray-800/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setRegisterMode(false)}
                  className={`py-2 rounded-md text-sm font-medium transition ${
                    !registerMode
                      ? "bg-emerald-500 text-gray-900"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterMode(true)}
                  className={`py-2 rounded-md text-sm font-medium transition ${
                    registerMode
                      ? "bg-emerald-500 text-gray-900"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  Crear cuenta
                </button>
              </div>

              {/* Formulario */}
              {registerMode ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const nombreOK =
                      auth.nombre.trim() ||
                      (auth.email ? auth.email.split("@")[0] : "");
                    if (
                      !nombreOK ||
                      !auth.email.trim() ||
                      !auth.password.trim()
                    )
                      return;
                    setUser({ nombre: nombreOK, email: auth.email.trim() });
                    setLogged(true);
                  }}
                >
                  <div>
                    <label className="text-xs text-white/70">
                      Nombre y apellido
                    </label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={auth.nombre}
                      onChange={(e) =>
                        setAuth((a) => ({ ...a, nombre: e.target.value }))
                      }
                      className="w-full mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">
                      Correo electrónico
                    </label>
                    <Input
                      placeholder="ejemplo@correo.com"
                      type="email"
                      value={auth.email}
                      onChange={(e) =>
                        setAuth((a) => ({ ...a, email: e.target.value }))
                      }
                      className="w-full mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Contraseña</label>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      value={auth.password}
                      onChange={(e) =>
                        setAuth((a) => ({ ...a, password: e.target.value }))
                      }
                      className="w-full mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!auth.email.trim() || !auth.password.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Crear cuenta
                  </Button>

                  <p className="text-center text-sm text-white/60">
                    ¿Ya tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-emerald-400 hover:underline"
                      onClick={() => setRegisterMode(false)}
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </form>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!auth.email.trim() || !auth.password.trim()) return;
                    const guessName = auth.email.split("@")[0] || "Usuario";
                    setUser({ nombre: guessName, email: auth.email.trim() });
                    setLogged(true);
                  }}
                >
                  <div>
                    <label className="text-xs text-white/70">
                      Correo electrónico
                    </label>
                    <Input
                      placeholder="ejemplo@correo.com"
                      type="email"
                      value={auth.email}
                      onChange={(e) =>
                        setAuth((a) => ({ ...a, email: e.target.value }))
                      }
                      className="w-full mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Contraseña</label>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      value={auth.password}
                      onChange={(e) =>
                        setAuth((a) => ({ ...a, password: e.target.value }))
                      }
                      className="w-full mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!auth.email.trim() || !auth.password.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Iniciar sesión
                  </Button>

                  <p className="text-center text-sm text-white/60">
                    ¿No tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-emerald-400 hover:underline"
                      onClick={() => setRegisterMode(true)}
                    >
                      Registrate
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8">
      {/* NAV */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 grid place-items-center text-emerald-300 font-bold">
            $
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestor de Gastos</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex items-center gap-3 rounded-full bg-gray-900/70 border border-white/10 px-2 py-1 hover:bg-gray-800"
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
          >
            {/* avatar "iniciales" */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 grid place-items-center text-gray-900 font-bold">
              {(user.nombre || "?")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold leading-none">
                {user.nombre || "Usuario"}
              </div>
              <div className="text-[11px] text-white/50">
                {user.email || "sin-email"}
              </div>
            </div>
          </button>

          {/* dropdown */}
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-gray-900/90 border border-white/10 shadow-2xl backdrop-blur p-1 z-50">
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
                onClick={() => {
                  setEditarCuenta(true);
                  setMenuAbierto(false);
                }}
              >
                Modificar cuenta
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-red-300"
                onClick={() => {
                  setLogged(false);
                  setMenuAbierto(false);
                  setAuth({ nombre: "", email: "", password: "" });
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="grid lg:grid-cols-3 gap-6">
        {/* Panel principal con estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 bg-gray-900/70 rounded-2xl p-6 border border-white/10 shadow-lg"
        >
          {/* Resumen */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-xl font-semibold">Resumen general</h2>
            {/* Selector de período */}
            <div className="flex items-center gap-1 bg-gray-800/60 rounded-xl p-1 border border-white/10">
              {[
                { key: "hoy", label: "Hoy" },
                { key: "semana", label: "Semana" },
                { key: "mes", label: "Mes" },
                { key: "año", label: "Año" },
                { key: "todo", label: "Ciclo de vida" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key as Periodo)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    periodo === p.key
                      ? "bg-emerald-500 text-gray-900"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <Card className="bg-gray-800/70 p-4 text-center">
              <h3 className="text-sm text-gray-400">Saldo actual</h3>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {saldoActual.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </p>
            </Card>
            <Card className="bg-gray-800/70 p-4 text-center">
              <h3 className="text-sm text-gray-400">Ingresos ({periodo})</h3>
              <p className="text-2xl font-bold text-emerald-500 mt-1">
                {totalIngresos.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </p>
            </Card>
            <Card className="bg-gray-800/70 p-4 text-center">
              <h3 className="text-sm text-gray-400">Gastos ({periodo})</h3>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {totalGastos.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </p>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            Estadísticas por categoría ({periodo})
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCategorias}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {dataCategorias.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Movimientos recientes: summary expandible */}
          <h2 className="text-xl font-semibold mt-8 mb-3">
            Movimientos recientes
          </h2>
          <ul className="space-y-2 text-gray-200">
            {movimientosFiltrados.map((m, i) => (
              <li
                key={i}
                className="bg-gray-800/60 rounded-lg overflow-hidden border border-white/5"
              >
                <details>
                  <summary className="flex items-center justify-between gap-3 p-3 cursor-pointer list-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-white/50 w-24">
                        {m.fecha}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          m.tipo === "gasto"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {m.tipo.toUpperCase()}
                      </span>
                      <span className="truncate">
                        {m.categoria} — {m.descripcion}
                      </span>
                    </div>
                    <span
                      className={`${
                        m.tipo === "gasto" ? "text-red-400" : "text-emerald-400"
                      } font-semibold`}
                    >
                      {m.tipo === "gasto" ? "-" : "+"}
                      {m.monto.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-white/80 grid md:grid-cols-3 gap-2">
                    <div>
                      <span className="text-white/50">Categoría: </span>
                      {m.categoria}
                    </div>
                    <div>
                      <span className="text-white/50">Método: </span>
                      {m.metodo || "—"}
                    </div>
                    <div>
                      <span className="text-white/50">Nota: </span>
                      {m.nota || "—"}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Panel para agregar ingresos o gastos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-gray-900/70 rounded-2xl p-6 border border-white/10 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Agregar nuevo registro</h2>
          <div className="flex space-x-3 mb-4">
            <Button
              className={`${
                tipo === "gasto" ? "bg-red-500 hover:bg-red-600" : "bg-gray-700"
              } w-full`}
              onClick={() => setTipo("gasto")}
            >
              Gasto
            </Button>
            <Button
              className={`${
                tipo === "ingreso"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-gray-700"
              } w-full`}
              onClick={() => setTipo("ingreso")}
            >
              Ingreso
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Descripción"
              className="bg-gray-800 border-gray-700 focus-visible:ring-emerald-500 me-2"
            />
            <Input
              value={form.monto}
              onChange={(e) =>
                setForm((f) => ({ ...f, monto: e.target.value }))
              }
              placeholder="Monto"
              type="number"
              className="bg-gray-800 border-gray-700 focus-visible:ring-emerald-500"
            />
            <select
              value={form.categoria}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoria: e.target.value }))
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>Comida</option>
              <option>Transporte</option>
              <option>Entretenimiento</option>
              <option>Educación</option>
              <option>Salario</option>
              <option>Otros</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={form.fecha}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fecha: e.target.value }))
                }
                type="date"
                max={todayISO}
                className="bg-gray-800 border-gray-700 focus-visible:ring-emerald-500"
              />
              <select
                value={form.metodo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metodo: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Efectivo</option>
                <option>Débito</option>
                <option>Crédito</option>
                <option>Transferencia</option>
                <option>Billetera virtual</option>
              </select>
            </div>
            <Input
              value={form.nota}
              onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
              placeholder="Nota (opcional)"
              className="bg-gray-800 border-gray-700 focus-visible:ring-emerald-500"
            />
            <Button
              onClick={() => guardarRegistro()}
              className={`${
                tipo === "gasto"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              } w-full`}
            >
              Guardar {tipo}
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Modal editar cuenta - Colores ajustados */}
      {editarCuenta && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur">
          <Card className="w-full max-w-lg bg-gray-900/95 border border-white/10 shadow-2xl">
            <CardContent className="p-0">
              <div className="px-6 pt-5 pb-4 border-b border-white/10 bg-gray-950 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Modificar cuenta
                  </h3>
                  <button
                    onClick={() => setEditarCuenta(false)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Actualizá tus datos. Los campos con * son obligatorios.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/70">Nombre *</label>
                    <Input
                      value={user.nombre}
                      onChange={(e) =>
                        setUser((u) => ({ ...u, nombre: e.target.value }))
                      }
                      placeholder="Nombre"
                      className="mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Email *</label>
                    <Input
                      value={user.email}
                      onChange={(e) =>
                        setUser((u) => ({ ...u, email: e.target.value }))
                      }
                      placeholder="Email"
                      type="email"
                      className="mt-1 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-white/70">
                      Nueva contraseña
                    </label>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="mt-1 ms-2 bg-gray-800 border-gray-700 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    className="border-white/20 bg-red-500 text-white hover:text-white hover:bg-red-600"
                    onClick={() => setEditarCuenta(false)}
                  >
                    Cancelar
                  </Button>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-400">
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl border ${
            toast.tone === "ok"
              ? "bg-emerald-600/90 border-emerald-300 text-white"
              : "bg-red-600/90 border-red-300 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
