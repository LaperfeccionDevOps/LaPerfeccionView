import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  FileText,
  LogOut,
  Building2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const PortalTrabajadorPage = () => {
  const navigate = useNavigate();

  const workerToken =
    localStorage.getItem("trabajador_token") || "";

  const workerName =
    localStorage.getItem("trabajador_nombre") || "";

  const workerDocument =
    localStorage.getItem("trabajador_documento") || "";

  const workerEps =
    localStorage.getItem("trabajador_eps") || "";

  React.useEffect(() => {
    if (!workerToken) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [workerToken, navigate]);

  const maskDocument = (document) => {
    const value = String(document || "").trim();

    if (!value) {
      return "No disponible";
    }

    if (value.length <= 4) {
      return value;
    }

    const lastFour = value.slice(-4);

    return `${"*".repeat(
      Math.max(value.length - 4, 4)
    )}${lastFour}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("trabajador_token");

    localStorage.removeItem(
      "trabajador_id_registro_personal"
    );

    localStorage.removeItem(
      "trabajador_documento"
    );

    localStorage.removeItem(
      "trabajador_nombre"
    );

    localStorage.removeItem(
      "trabajador_eps"
    );

    navigate("/login", {
      replace: true,
    });
  };

  const handleIncapacidades = () => {
    navigate("/trabajador/incapacidades");
  };

  if (!workerToken) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

          <div className="p-5 md:p-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Portal del Trabajador
                  </p>

                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Bienvenido
                  </h1>

                  <p className="text-lg font-semibold text-teal-700 mt-1">
                    {workerName || "Trabajador"}
                  </p>

                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>

            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">

                <div className="flex items-center gap-3 mb-2">

                  <ShieldCheck className="w-5 h-5 text-teal-600" />

                  <p className="text-sm font-semibold text-gray-600">
                    Número de identificación
                  </p>

                </div>

                <p className="text-lg font-bold text-gray-800">
                  {maskDocument(workerDocument)}
                </p>

              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">

                <div className="flex items-center gap-3 mb-2">

                  <Building2 className="w-5 h-5 text-blue-600" />

                  <p className="text-sm font-semibold text-gray-600">
                    EPS
                  </p>

                </div>

                <p className="text-lg font-bold text-gray-800">
                  {workerEps || "No registrada"}
                </p>

              </div>

            </div>

            <div className="mt-8">

              <div className="mb-4">

                <h2 className="text-xl font-bold text-gray-800">
                  Servicios disponibles
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Seleccione el servicio que desea gestionar.
                </p>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <button
                  type="button"
                  onClick={handleIncapacidades}
                  className="group w-full text-left bg-white border-2 border-emerald-100 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">

                      <FileText className="w-6 h-6" />

                    </div>

                    <div>

                      <h3 className="font-bold text-gray-800 group-hover:text-emerald-700">
                        Incapacidades
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Registrar y consultar mis incapacidades
                      </p>

                    </div>

                  </div>

                </button>

              </div>

            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center">

              <p className="text-xs text-gray-400">
                Portal del Trabajador - Recursos Humanos
              </p>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default PortalTrabajadorPage;