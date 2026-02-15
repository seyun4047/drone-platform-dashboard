import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Cpu,
  X,
  History,
  Camera,
  Info,
  MapPin,
  Battery,
  Wind,
  Github,
  PackagePlus,
  AlertCircle,
  Activity,
  MessageSquare,
  Play,
  Navigation,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { ENV } from "../env";
import {
  User,
  DroneInfo,
  RefreshInterval,
  EventData,
  TelemetryData,
} from "../types";
import RefreshControls from "../components/RefreshControls";
import DroneCard from "../components/DroneCard";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface TelemetryLogEntry extends TelemetryData {
  timestamp: number;
}

interface EventLogEntry extends EventData {
  timestamp: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [drones, setDrones] = useState<DroneInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(
    RefreshInterval.SEC_10,
  );
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [activeLogTab, setActiveLogTab] = useState<"events" | "telemetry">(
    "events",
  );

  const [focusedHistoryEvent, setFocusedHistoryEvent] =
    useState<EventLogEntry | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<{
    [serial: string]: TelemetryLogEntry[];
  }>({});
  const [eventHistory, setEventHistory] = useState<{
    [serial: string]: EventLogEntry[];
  }>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dronesRef = useRef<DroneInfo[]>([]);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dronesRef.current = drones;
  }, [drones]);

  useEffect(() => {
    setFocusedHistoryEvent(null);
  }, [selectedSerial]);

  const safeFixed = (val: any, digits: number = 0): string => {
    const num = Number(val);
    return isNaN(num) ? "---" : num.toFixed(digits);
  };

  const fetchDroneData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const serials = await apiService.getAliveDrones();
      const now = Date.now();

      const updatedDrones = await Promise.all(
        serials.map(async (serial) => {
          let telemetryRes = null;
          let eventRes = null;

          try {
            telemetryRes = await apiService.getTelemetry(serial);
          } catch (e: any) {
            if (e.message === "AUTH_EXPIRED") throw e;
          }
          try {
            eventRes = await apiService.getEvent(serial);
          } catch (e: any) {
            if (e.message === "AUTH_EXPIRED") throw e;
          }

          const tData = telemetryRes?.data;
          const eData = eventRes?.data;
          const tTime = telemetryRes?.updatedAt || 0;
          const eTime = eventRes?.updatedAt || 0;

          const prevDrone = dronesRef.current.find((d) => d.serial === serial);

          let currentTelemetry: TelemetryData = prevDrone?.telemetry || {
            speed: 0,
            power: 0,
            longitude: 0,
            latitude: 0,
            person_count: 0,
          };

          if (tData && tTime >= eTime) {
            currentTelemetry = { ...tData };
          } else if (eData) {
            currentTelemetry = {
              speed: eData.speed,
              power: eData.power,
              longitude: eData.longitude,
              latitude: eData.latitude,
              person_count: eData.person_count,
            };
          }

          let currentEvent: EventData = eData
            ? { ...eData }
            : prevDrone?.event || {
                ...currentTelemetry,
                event_detail: { message: "STANDBY", image: "" },
              };

          const finalUpdateTs = Math.max(tTime, eTime) || now;

          setTelemetryHistory((prev) => {
            const list = prev[serial] || [];
            const last = list[0];
            const isChanged =
              !last ||
              last.speed !== currentTelemetry.speed ||
              last.latitude !== currentTelemetry.latitude ||
              last.longitude !== currentTelemetry.longitude;
            if (!isChanged) return prev;
            return {
              ...prev,
              [serial]: [
                { ...currentTelemetry, timestamp: finalUpdateTs },
                ...list,
              ].slice(0, 50),
            };
          });

          if (eData && eTime > 0) {
            setEventHistory((prev) => {
              const list = prev[serial] || [];
              const last = list[0];
              const isNewEvent = !last || eTime > last.timestamp;
              if (!isNewEvent) return prev;
              return {
                ...prev,
                [serial]: [
                  { ...currentEvent, timestamp: eTime },
                  ...list,
                ].slice(0, 50),
              };
            });
          }

          return {
            serial,
            name: serial.toUpperCase(),
            telemetry: currentTelemetry,
            event: currentEvent,
            lastUpdate: finalUpdateTs,
          };
        }),
      );

      setDrones(updatedDrones);
    } catch (error: any) {
      if (error.message === "AUTH_EXPIRED") onLogout();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchDroneData();
  }, [fetchDroneData]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (refreshInterval !== RefreshInterval.OFF) {
      timerRef.current = setInterval(() => fetchDroneData(), refreshInterval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshInterval, fetchDroneData]);

  const liveDrone = useMemo(
    () => drones.find((d) => d.serial === selectedSerial),
    [drones, selectedSerial],
  );

  const displayData = useMemo(() => {
    if (!liveDrone) return null;
    if (focusedHistoryEvent) {
      return {
        isLive: false,
        telemetry: {
          speed: focusedHistoryEvent.speed,
          power: focusedHistoryEvent.power,
          latitude: focusedHistoryEvent.latitude,
          longitude: focusedHistoryEvent.longitude,
          person_count: focusedHistoryEvent.person_count,
        },
        event: focusedHistoryEvent,
        timestamp: focusedHistoryEvent.timestamp,
      };
    }
    return {
      isLive: true,
      telemetry: liveDrone.telemetry,
      event: liveDrone.event,
      timestamp: liveDrone.lastUpdate,
    };
  }, [liveDrone, focusedHistoryEvent]);

  return (
    <div className="flex h-screen bg-slate-950 text-sky-100 font-sans overflow-hidden">
      {/* Sidebar - Expanded only above 1200px */}
      <aside className="w-20 min-[1201px]:w-72 border-r border-sky-900/50 bg-slate-900/50 flex flex-col items-center min-[1201px]:items-stretch p-4 gap-8 shrink-0 relative transition-all duration-300">
        <div className="flex items-center gap-3 px-2">
          {/* <ShieldCheck size={32} className="text-sky-50 shrink-0" /> */}
          <div className="hidden min-[1201px]:flex flex-col">
            <span className="font-futuristic text-xl tracking-tighter glow-text-blue leading-tight uppercase">
              Main-Drone
            </span>
            <span className="text-[8px] text-sky-500/80 font-mono uppercase tracking-widest mt-1">
              MAnufacturer INdependent<br></br>Drone Monitoring Platform
            </span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          <button className="flex items-center gap-4 p-3 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
            <LayoutDashboard size={20} />
            <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-wide">
              Dashboard
            </span>
          </button>
          <div className="mt-8 pt-4 border-t border-sky-900/30">
            <p className="hidden min-[1201px]:block text-[9px] text-sky-500/40 font-futuristic uppercase tracking-[0.2em] mb-3 px-2">
              External
            </p>
            <a
              href="https://github.com/seyun4047"
              target="_blank"
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 text-sky-500/50 transition-colors"
            >
              <Github size={20} />
              <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-wide">
                Developer
              </span>
            </a>
          </div>
        </nav>
        <div className="mt-auto border-t border-sky-900/30 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative  min-w-[310px] overflow-x-auto">
        <main
          className={`flex-1 p-4 min-[1201px]:p-8 custom-scroll transition-all duration-500 ${selectedSerial ? "mr-0 min-[1201px]:mr-[400px]" : ""}`}
        >
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl min-[1201px]:text-3xl font-futuristic text-white glow-text-blue tracking-tight uppercase">
                  Drone Status
                </h2>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  Active
                </span>
                <span className="text-[10px] text-sky-500/50 font-mono uppercase">
                  Nodes: {drones.length}
                </span>
              </div>
            </div>
            <RefreshControls
              interval={refreshInterval}
              onIntervalChange={setRefreshInterval}
              onManualRefresh={fetchDroneData}
              isRefreshing={isRefreshing}
            />
          </header>

          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-sky-500/50">
              <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="font-futuristic text-xs tracking-widest animate-pulse uppercase">
                Establishing Link...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-24">
              {drones.map((drone) => (
                <DroneCard
                  key={drone.serial}
                  drone={drone}
                  isSelected={selectedSerial === drone.serial}
                  onClick={(serial) =>
                    setSelectedSerial(serial === selectedSerial ? null : serial)
                  }
                />
              ))}
            </div>
          )}
        </main>

        {/* Detail Panel - Mobile/Overlay below 1200px */}
        <aside
          className={`absolute top-0 right-0 h-full w-full min-[1201px]:w-[400px] glass border-l border-sky-400/30 z-20 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col ${selectedSerial ? "translate-x-0" : "translate-x-full"}`}
        >
          {liveDrone && displayData ? (
            <>
              <div className="p-6 border-b border-sky-900/50 flex items-center justify-between bg-sky-900/20 shrink-0">
                <div className="flex flex-col">
                  <h3 className="font-futuristic text-white text-lg uppercase tracking-wider">
                    {liveDrone.name}
                  </h3>
                  <span className="text-[8px] text-sky-500/60 font-mono uppercase tracking-widest mt-1">
                    Satellite Tracking Enabled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!displayData.isLive && (
                    <button
                      onClick={() => setFocusedHistoryEvent(null)}
                      className="px-3 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-futuristic text-[10px] rounded border border-orange-400 animate-pulse uppercase tracking-wider"
                    >
                      Back to Live
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSerial(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-sky-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div
                ref={detailPanelRef}
                className="flex-1 custom-scroll p-6 space-y-8 bg-black/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-futuristic text-sky-500/70 uppercase tracking-[0.2em]">
                      <Camera size={14} />{" "}
                      {displayData.isLive ? "Live Feed" : "Historical Snapshot"}
                    </div>
                    {displayData.isLive ? (
                      <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-mono animate-pulse uppercase">
                        Real-Time
                      </span>
                    ) : (
                      <span className="text-[8px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 font-mono uppercase">
                        Event Record
                      </span>
                    )}
                  </div>
                  <div className="aspect-video relative rounded-2xl overflow-hidden border border-sky-400/20 shadow-inner group bg-slate-900">
                    {displayData.event?.event_detail.image ? (
                      <img
                        src={displayData.event.event_detail.image}
                        alt="Feed"
                        className={`w-full h-full object-cover transition-all duration-500 ${displayData.isLive ? "grayscale brightness-110 contrast-125" : "brightness-100 contrast-100"}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-red-500/40 bg-black">
                        <AlertCircle size={48} className="animate-pulse mb-4" />
                        <span className="font-futuristic text-lg tracking-[0.3em] uppercase">
                          No Feed
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-20"></div>
                  </div>
                  <div
                    className={`p-4 border rounded-xl transition-colors ${displayData.isLive ? "bg-sky-500/10 border-sky-500/30" : "bg-orange-500/10 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]"}`}
                  >
                    <div className="text-[9px] text-sky-400 font-futuristic mb-1 uppercase tracking-widest flex justify-between">
                      <span>Tactical Message</span>
                      <span className="font-mono">
                        {new Date(displayData.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-white font-mono uppercase">
                      {displayData.event?.event_detail.message || "NOMINAL"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-futuristic text-sky-500/70 uppercase tracking-[0.2em]">
                    <Info size={14} />{" "}
                    {displayData.isLive
                      ? "Live Telemetry"
                      : "Snapshot Telemetry"}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        icon: <MapPin size={14} />,
                        label: "Lat",
                        val: safeFixed(displayData.telemetry?.latitude, 6),
                      },
                      {
                        icon: <MapPin size={14} />,
                        label: "Lng",
                        val: safeFixed(displayData.telemetry?.longitude, 6),
                      },
                      {
                        icon: <Wind size={14} />,
                        label: "Velocity",
                        val: safeFixed(displayData.telemetry?.speed, 1),
                        unit: "km/h",
                      },
                      {
                        icon: <Battery size={14} />,
                        label: "Energy",
                        val: safeFixed(displayData.telemetry?.power, 0),
                        unit: "%",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-colors ${displayData.isLive ? "bg-sky-950/40 border-sky-500/10 hover:border-sky-500/30" : "bg-orange-950/20 border-orange-500/20"}`}
                      >
                        <div className="flex items-center gap-2 text-[9px] text-sky-500/80 mb-1 uppercase tracking-tighter">
                          {item.icon} {item.label}
                        </div>
                        <div className="text-base font-bold text-white font-mono uppercase">
                          {item.val}{" "}
                          {item.val !== "---" && item.unit && (
                            <span className="text-[10px] opacity-30 font-normal">
                              {item.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pb-12">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                    <div className="flex items-center gap-2 text-[10px] font-futuristic text-sky-400 uppercase tracking-widest">
                      <History size={14} /> Mission History
                    </div>
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                      <button
                        onClick={() => setActiveLogTab("events")}
                        className={`text-[9px] px-3 py-1 rounded-md transition-all font-futuristic uppercase ${activeLogTab === "events" ? "bg-sky-500 text-slate-950 font-bold" : "text-sky-500/40 hover:text-sky-200"}`}
                      >
                        Events
                      </button>
                      <button
                        onClick={() => setActiveLogTab("telemetry")}
                        className={`text-[9px] px-3 py-1 rounded-md transition-all font-futuristic uppercase ${activeLogTab === "telemetry" ? "bg-sky-500 text-slate-950 font-bold" : "text-sky-500/40 hover:text-sky-200"}`}
                      >
                        Telem
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[350px] custom-scroll pr-2">
                    {activeLogTab === "events"
                      ? (eventHistory[selectedSerial!] || []).map(
                          (entry, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setFocusedHistoryEvent(entry);
                                detailPanelRef.current?.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              className={`group border p-3 rounded-lg flex items-start gap-3 transition-all cursor-pointer animate-in slide-in-from-right-2 duration-300 ${focusedHistoryEvent?.timestamp === entry.timestamp ? "bg-orange-500/20 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-sky-950/20 border-sky-500/10 hover:bg-sky-500/10 hover:border-sky-500/30"}`}
                            >
                              <div
                                className={`mt-1 shrink-0 p-1 rounded ${focusedHistoryEvent?.timestamp === entry.timestamp ? "bg-orange-500 text-white" : "text-sky-400 group-hover:bg-sky-400 group-hover:text-slate-950 transition-colors"}`}
                              >
                                <Play size={10} fill="currentColor" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[8px] font-mono text-sky-500/50">
                                    {new Date(
                                      entry.timestamp,
                                    ).toLocaleTimeString()}
                                  </span>
                                  <span
                                    className={`text-[7px] px-1 rounded-sm font-bold uppercase ${entry.event_detail.image ? "bg-sky-500/20 text-sky-400" : "bg-slate-500/20 text-slate-500"}`}
                                  >
                                    {entry.event_detail.image
                                      ? "Snapshot"
                                      : "Log"}
                                  </span>
                                </div>
                                <p
                                  className={`text-[10px] font-mono uppercase truncate tracking-tight transition-colors ${focusedHistoryEvent?.timestamp === entry.timestamp ? "text-orange-200" : "text-white/90 group-hover:text-sky-200"}`}
                                >
                                  {entry.event_detail.message}
                                </p>
                              </div>
                            </div>
                          ),
                        )
                      : (telemetryHistory[selectedSerial!] || []).map(
                          (entry, i) => (
                            <div
                              key={i}
                              className="bg-sky-950/20 border border-sky-500/10 p-3 rounded-lg hover:bg-sky-500/5 transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Activity
                                    size={10}
                                    className="text-green-500"
                                  />
                                  <span className="text-[9px] font-mono text-sky-400/80 uppercase">
                                    Node Stream
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono text-sky-500/40">
                                  {new Date(
                                    entry.timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center">
                                <div className="flex flex-col bg-black/30 rounded p-1">
                                  <span className="text-[7px] text-sky-500/40 uppercase">
                                    Vel
                                  </span>
                                  <span className="text-white">
                                    {safeFixed(entry.speed, 1)}
                                  </span>
                                </div>
                                <div className="flex flex-col bg-black/30 rounded p-1">
                                  <span className="text-[7px] text-sky-500/40 uppercase">
                                    Pwr
                                  </span>
                                  <span className="text-sky-400">
                                    {safeFixed(entry.power, 0)}%
                                  </span>
                                </div>
                                <div className="flex flex-col bg-black/30 rounded p-1">
                                  <span className="text-[7px] text-sky-500/40 uppercase">
                                    Lat
                                  </span>
                                  <span className="text-white/60">
                                    {safeFixed(entry.latitude, 2)}
                                  </span>
                                </div>
                                <div className="flex flex-col bg-black/30 rounded p-1">
                                  <span className="text-[7px] text-sky-500/40 uppercase">
                                    Lng
                                  </span>
                                  <span className="text-white/60">
                                    {safeFixed(entry.longitude, 2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-sky-500/30 font-futuristic uppercase tracking-[0.5em]">
              <Cpu size={80} className="mb-8 opacity-5" />
              <p className="text-[11px]">Select Node</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
