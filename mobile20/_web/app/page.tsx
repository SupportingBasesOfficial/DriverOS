"use client";

import { useEffect, useState } from "react";
import { createClient } from "@repo/supabase/client";

const supabase = createClient();

type Trip = {
  id: string;
  category: string;
  distance_km: number | null;
  fare_amount: number | null;
  status: string;
  started_at: string;
};

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("trips")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setTrips(data as Trip[]);
        setLoading(false);
      });
  }, []);

  const completed = trips.filter((t) => t.status === "completed");
  const totalKm = completed.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const totalEarnings = completed.reduce((sum, t) => sum + (t.fare_amount || 0), 0);
  const paidKm = completed
    .filter((t) => t.category === "passenger_dropoff" || t.category === "passenger_pickup")
    .reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const efficiency = totalKm > 0 ? Math.round((paidKm / totalKm) * 100) : 0;

  const categoryKm: Record<string, number> = {};
  completed.forEach((t) => {
    categoryKm[t.category] = (categoryKm[t.category] || 0) + (t.distance_km || 0);
  });
  const categoryColors: Record<string, string> = {
    passenger_dropoff: "bg-green-500",
    passenger_pickup: "bg-green-400",
    repositioning: "bg-yellow-500",
    personal: "bg-gray-500",
    unpaid_detour: "bg-red-500",
    refueling: "bg-blue-500",
  };
  const categoryLabels: Record<string, string> = {
    passenger_dropoff: "Corridas",
    passenger_pickup: "Buscas",
    repositioning: "Reposicionamento",
    personal: "Pessoal",
    unpaid_detour: "Desvios",
    refueling: "Abastecimento",
  };
  const maxCatKm = Math.max(...Object.values(categoryKm).concat([1]));

  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DriverOS</h1>
        <p className="text-slate-400">Painel Administrativo</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Ganhos Hoje</p>
          <p className="text-white text-3xl font-bold">R$ {totalEarnings.toFixed(2).replace(".", ",")}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">KM Rodado</p>
          <p className="text-white text-3xl font-bold">{totalKm.toFixed(1)} km</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Viagens</p>
          <p className="text-white text-3xl font-bold">{completed.length}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Eficiencia</p>
          <p className="text-white text-3xl font-bold">{efficiency}%</p>
        </div>
      </section>

      {loading && (
        <p className="text-slate-400 mb-4">Carregando dados...</p>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Ultimas Viagens</h2>
          <div className="space-y-3">
            {trips.slice(0, 7).map((trip) => (
              <div key={trip.id} className="flex justify-between items-center bg-slate-700 px-4 py-2 rounded-xl">
                <span className="text-white font-medium text-sm">{categoryLabels[trip.category] || trip.category}</span>
                <span className="text-slate-300 text-sm">{(trip.distance_km || 0).toFixed(1)} km</span>
                <span className="text-green-400 font-semibold text-sm">
                  {trip.fare_amount ? `R$ ${trip.fare_amount.toFixed(0)}` : "—"}
                </span>
              </div>
            ))}
            {trips.length === 0 && !loading && (
              <p className="text-slate-400 text-sm">Nenhuma viagem registrada ainda.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Categorias de Viagem</h2>
          <div className="space-y-3">
            {Object.entries(categoryKm).map(([cat, km]) => (
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-white text-sm">{categoryLabels[cat] || cat}</span>
                  <span className="text-slate-300 text-sm">{km.toFixed(1)} km</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className={`${categoryColors[cat] || "bg-driveros-500"} h-2 rounded-full`} style={{ width: `${(km / maxCatKm) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(categoryKm).length === 0 && !loading && (
              <p className="text-slate-400 text-sm">Nenhum dado de categoria.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
