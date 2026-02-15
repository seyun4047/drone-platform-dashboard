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
  AlertCircle,
  Activity,
  Play,
  Zap,
  ListFilter,
} from "lucide-react";
import { apiService } from "../services/apiService";
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
  droneName: string;
  serial: string;
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
  const [isTickerVisible, setIsTickerVisible] = useState(true);

  const [unreadCounts, setUnreadCounts] = useState<{
    [serial: string]: number;
  }>({});
  const lastSeenTimestamps = useRef<{ [serial: string]: number }>({});
  const [telemetryHistory, setTelemetryHistory] = useState<{
    [serial: string]: TelemetryLogEntry[];
  }>({});
  const [eventHistory, setEventHistory] = useState<{
    [serial: string]: EventLogEntry[];
  }>({});
  const [globalEventTicker, setGlobalEventTicker] = useState<EventLogEntry[]>(
    [],
  );
  const [focusedHistoryEvent, setFocusedHistoryEvent] =
    useState<EventLogEntry | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dronesRef = useRef<DroneInfo[]>([]);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dronesRef.current = drones;
  }, [drones]);

  useEffect(() => {
    if (selectedSerial) {
      setUnreadCounts((prev) => ({ ...prev, [selectedSerial]: 0 }));
    }
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
          let telemetryRes = null,
            eventRes = null;
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

          const tData = telemetryRes?.data,
            eData = eventRes?.data;
          const tTime = telemetryRes?.updatedAt || 0,
            eTime = eventRes?.updatedAt || 0;
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
            if (
              list[0]?.speed === currentTelemetry.speed &&
              list[0]?.latitude === currentTelemetry.latitude
            )
              return prev;
            return {
              ...prev,
              [serial]: [
                { ...currentTelemetry, timestamp: finalUpdateTs },
                ...list,
              ].slice(0, 50),
            };
          });

          if (eData && eTime > 0) {
            const lastKnown = lastSeenTimestamps.current[serial] || 0;
            if (eTime > lastKnown) {
              const eventEntry = {
                ...currentEvent,
                timestamp: eTime,
                droneName: serial.toUpperCase(),
                serial,
              };
              setEventHistory((prev) => ({
                ...prev,
                [serial]: [eventEntry, ...(prev[serial] || [])].slice(0, 50),
              }));
              setGlobalEventTicker((prev) =>
                [eventEntry, ...prev].slice(0, 40),
              );
              if (selectedSerial !== serial) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [serial]: (prev[serial] || 0) + 1,
                }));
              }
              lastSeenTimestamps.current[serial] = eTime;
            }
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
      updatedDrones.sort((a, b) => a.serial.localeCompare(b.serial));
      setDrones(updatedDrones);
    } catch (error: any) {
      if (error.message === "AUTH_EXPIRED") onLogout();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onLogout, selectedSerial]);

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
    if (focusedHistoryEvent)
      return {
        isLive: false,
        telemetry: focusedHistoryEvent,
        event: focusedHistoryEvent,
        timestamp: focusedHistoryEvent.timestamp,
      };
    return {
      isLive: true,
      telemetry: liveDrone.telemetry,
      event: liveDrone.event,
      timestamp: liveDrone.lastUpdate,
    };
  }, [liveDrone, focusedHistoryEvent]);

  return (
    <div className="flex h-screen bg-[#020617] text-sky-100 font-sans overflow-hidden">
      {/* Sidebar - Primary fixed width */}
      <aside className="w-16 min-[1201px]:w-56 border-r border-sky-900/40 bg-[#0f172a] flex flex-col items-center min-[1201px]:items-stretch p-4 gap-8 shrink-0 relative z-[100] transition-all duration-300 shadow-2xl">
        <div className="flex items-center gap-3 px-1 min-[1201px]:px-2">
          <div className="hidden min-[1201px]:flex flex-col">
            {/* <span className="font-futuristic text-xs tracking-[0.2em] text-sky-400 uppercase leading-tight font-bold"> */}
            <span className="font-futuristic text-xl tracking-tighter glow-text-blue leading-tight uppercase">
              MAIN-DRONE
            </span>
            <span className="text-[8px] text-sky-500/40 uppercase font-mono mt-1">
              DRONE MONITORING PLATFORM
            </span>
          </div>
          <div className="min-[1201px]:hidden flex items-center justify-center w-full text-sky-400">
            <p>M</p>
            {/* <ShieldCheck size={24} /> */}
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-2.5">
          <button className="flex items-center gap-4 p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-400/20 shadow-lg shadow-sky-500/5 transition-transform active:scale-95">
            <LayoutDashboard size={20} />
            {/* <span className="hidden min-[1201px]:block font-futuristic text-[11px] uppercase tracking-widest font-bold"> */}
            <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-wide">
              DASHBOARD
            </span>
          </button>
          <button
            onClick={() => setIsTickerVisible(!isTickerVisible)}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all border active:scale-95 ${isTickerVisible ? "bg-sky-400 text-slate-950 border-sky-400 font-bold" : "hover:bg-white/5 border-transparent text-sky-500/50"}`}
          >
            <ListFilter size={20} />
            {/* <span className="hidden min-[1201px]:block font-futuristic text-[11px] uppercase tracking-widest"> */}
            <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-wide">
              Events
            </span>
          </button>
          <div className="mt-8 pt-4 border-t border-sky-900/30">
            <a
              href="https://github.com/seyun4047"
              target="_blank"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-sky-500/40 transition-colors"
            >
              <Github size={20} />
              {/* <span className="hidden min-[1201px]:block font-futuristic text-[11px] uppercase tracking-widest"> */}
              <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-wide">
                DEVELOPER
              </span>
            </a>
          </div>
        </nav>
        <div className="mt-auto pt-4 border-t border-sky-900/30">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/15 text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden min-[1201px]:block font-futuristic text-sm uppercase tracking-widest font-bold">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Only */}
      {isTickerVisible && (
        <div
          className="min-[1001px]:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          onClick={() => setIsTickerVisible(false)}
        />
      )}

      {/* SYSTEM EVENTS Panel - Now slides and collapses width */}
      <aside
        className={`fixed min-[1001px]:relative inset-y-0 left-16 min-[1001px]:left-0 z-[90] min-[1001px]:z-30 flex flex-col bg-[#0b1222] shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${isTickerVisible ? "w-[calc(100%-64px)] sm:w-72 min-[1201px]:w-80 border-r border-sky-900/40 opacity-100" : "w-0 opacity-0 border-transparent pointer-events-none"}`}
      >
        <div className="p-5 border-b border-sky-900/50 flex items-center justify-between bg-sky-900/10 min-w-[280px]">
          <h3 className="font-futuristic text-[11px] text-sky-400 uppercase tracking-[0.2em] flex items-center gap-3 font-bold whitespace-nowrap">
            <Activity size={16} className="animate-pulse" /> EVENTS LOGS
          </h3>
          <button
            onClick={() => setIsTickerVisible(false)}
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-sky-500/40 hover:text-red-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 custom-scroll p-4 pr-10 space-y-4 overflow-x-hidden min-w-[280px]">
          {globalEventTicker.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-[10px] font-futuristic text-center px-6 uppercase tracking-widest gap-4">
              <Zap size={24} className="animate-pulse" />
              Monitoring...
            </div>
          ) : (
            globalEventTicker.map((ev, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedSerial(ev.serial);
                  if (window.innerWidth < 1001) setIsTickerVisible(false);
                }}
                className="p-4 rounded-2xl border border-sky-500/10 bg-sky-900/20 hover:border-sky-400/60 cursor-pointer group transition-all shadow-sm w-full relative"
              >
                <div className="flex justify-between items-start mb-2.5 gap-2 pr-2">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-tighter truncate max-w-[120px]">
                    {ev.droneName}
                  </span>
                  <span className="text-[8px] font-mono text-sky-500/70 bg-sky-500/10 px-2 py-0.5 rounded tracking-tighter shrink-0 border border-sky-500/10">
                    {new Date(ev.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/80 leading-relaxed uppercase group-hover:text-white transition-colors break-words pr-2">
                  {ev.event_detail.message}
                </p>
                <div className="mt-3 h-px w-0 group-hover:w-full bg-sky-400/50 transition-all duration-700"></div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area - Flows to fill space when ticker collapses */}
      <div className="flex-1 flex overflow-hidden relative">
        <main
          className={`flex-1 p-5 min-[1201px]:px-10 min-[1201px]:py-10 custom-scroll transition-all duration-500 ${selectedSerial ? "mr-0 min-[1201px]:mr-[340px] min-[1400px]:mr-[400px]" : ""}`}
        >
          <header className="flex flex-row items-start justify-between gap-4 mb-8 min-[1201px]:mb-12 shrink-0 relative max-w-[1400px] ml-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                {/* <h2 className="text-xl sm:text-2xl min-[1400px]:text-4xl font-futuristic text-white glow-text-blue tracking-tight uppercase font-black truncate"> */}
                <h2 className="text-2xl min-[1201px]:text-3xl font-futuristic text-white glow-text-blue tracking-tight uppercase">
                  DRONE STATUS
                </h2>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 mt-2 sm:mt-2.5">
                <span className="flex items-center gap-2 text-[9px] min-[1201px]:text-[11px] text-green-400 font-mono uppercase font-bold shrink-0">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                  ACTIVE
                </span>
                <span className="hidden sm:inline-block text-[9px] min-[1201px]:text-[11px] text-sky-500/60 font-mono uppercase tracking-widest truncate">
                  ALIVE: {drones.length}
                </span>
              </div>
            </div>
            <div className="shrink-0 pt-0.5 ml-auto">
              <RefreshControls
                interval={refreshInterval}
                onIntervalChange={setRefreshInterval}
                onManualRefresh={fetchDroneData}
                isRefreshing={isRefreshing}
              />
            </div>
          </header>

          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-6 text-sky-500/40 w-full">
              <div className="w-14 h-14 border-[5px] border-sky-500/10 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="font-futuristic text-[11px] tracking-[0.4em] animate-pulse uppercase font-bold text-center">
                Initializing Neural Matrix...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-32 max-w-[1400px] ml-0">
              {drones.map((drone) => (
                <DroneCard
                  key={drone.serial}
                  drone={drone}
                  unreadCount={unreadCounts[drone.serial] || 0}
                  isSelected={selectedSerial === drone.serial}
                  onClick={(serial) =>
                    setSelectedSerial(serial === selectedSerial ? null : serial)
                  }
                />
              ))}
            </div>
          )}
        </main>

        {/* Detail Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-full min-[1201px]:w-[340px] min-[1400px]:w-[400px] glass border-l border-sky-400/30 z-[110] transition-transform duration-500 ease-in-out shadow-[-30px_0_60px_rgba(0,0,0,0.6)] flex flex-col ${selectedSerial ? "translate-x-0" : "translate-x-full"}`}
        >
          {liveDrone && displayData ? (
            <>
              <div className="p-5 border-b border-sky-900/50 flex items-center justify-between bg-sky-900/25 shrink-0 backdrop-blur-xl">
                <div className="flex flex-col">
                  <h3 className="font-futuristic text-white text-sm uppercase tracking-widest font-bold">
                    {liveDrone.name}
                  </h3>
                  <span className="text-[8px] text-sky-400/60 font-mono uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-sky-400"></div>{" "}
                    ANALYTICS_MODE
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {!displayData.isLive && (
                    <button
                      onClick={() => setFocusedHistoryEvent(null)}
                      className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black font-futuristic text-[9px] rounded-lg animate-pulse uppercase tracking-wider"
                    >
                      LIVE_FEED
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
                className="flex-1 custom-scroll p-6 space-y-8 bg-black/10"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-[9px] font-futuristic text-sky-500/80 uppercase tracking-[0.2em] font-bold">
                    <Camera size={16} /> VISUAL_INTELLIGENCE
                  </div>
                  <div className="aspect-video relative rounded-2xl overflow-hidden border border-sky-400/20 bg-slate-950 shadow-2xl">
                    {displayData.event?.event_detail.image ? (
                      <img
                        src={displayData.event.event_detail.image}
                        alt="Feed"
                        className={`w-full h-full object-cover transition-all duration-700 ${displayData.isLive ? "grayscale-[0.5] brightness-110" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-red-500/30 bg-[#020617]">
                        <AlertCircle size={40} className="animate-pulse mb-4" />
                        <span className="font-futuristic text-[10px] tracking-[0.4em] uppercase font-bold opacity-40">
                          Tactical Offline
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-10"></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 backdrop-blur-sm">
                    <div className="text-[8px] text-sky-400 font-futuristic mb-2 uppercase tracking-widest flex justify-between font-bold">
                      <span>Tactical_Report</span>
                      <span className="font-mono opacity-60">
                        {new Date(displayData.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] min-[1201px]:text-xs text-white/90 font-mono uppercase leading-relaxed tracking-tight">
                      {displayData.event?.event_detail.message ||
                        "NOMINAL_OPERATING_CONDITION"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-[9px] font-futuristic text-sky-500/80 uppercase tracking-[0.2em] font-bold">
                    <Info size={16} /> TELEMETRY_MATRIX
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        icon: <MapPin size={12} />,
                        label: "LAT",
                        val: safeFixed(displayData.telemetry?.latitude, 5),
                      },
                      {
                        icon: <MapPin size={12} />,
                        label: "LNG",
                        val: safeFixed(displayData.telemetry?.longitude, 5),
                      },
                      {
                        icon: <Wind size={12} />,
                        label: "SPD",
                        val: safeFixed(displayData.telemetry?.speed, 1),
                        unit: "kph",
                      },
                      {
                        icon: <Battery size={12} />,
                        label: "PWR",
                        val: safeFixed(displayData.telemetry?.power, 0),
                        unit: "%",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border bg-sky-950/40 border-sky-500/10 transition-all hover:bg-sky-900/20 hover:border-sky-500/30"
                      >
                        <div className="flex items-center gap-2 text-[8px] text-sky-500/70 mb-1.5 uppercase font-bold tracking-wider">
                          {item.icon} {item.label}
                        </div>
                        <div className="text-sm font-bold text-white font-mono tracking-tighter truncate">
                          {item.val}
                          <span className="text-[10px] opacity-40 ml-1 uppercase">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 pb-16">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                    <div className="flex items-center gap-2.5 text-[9px] font-futuristic text-sky-400 uppercase tracking-[0.2em] font-bold">
                      <History size={16} /> EVENT_ARCHIVE
                    </div>
                    <div className="flex gap-1.5 p-1 bg-black/50 rounded-xl border border-white/5">
                      <button
                        onClick={() => setActiveLogTab("events")}
                        className={`text-[8px] px-3 py-1 rounded-lg transition-all font-futuristic uppercase font-bold tracking-widest ${activeLogTab === "events" ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20" : "text-sky-500/40 hover:text-sky-300"}`}
                      >
                        Evt
                      </button>
                      <button
                        onClick={() => setActiveLogTab("telemetry")}
                        className={`text-[8px] px-3 py-1 rounded-lg transition-all font-futuristic uppercase font-bold tracking-widest ${activeLogTab === "telemetry" ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20" : "text-sky-500/40 hover:text-sky-300"}`}
                      >
                        Tel
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5 max-h-[300px] custom-scroll pr-1.5">
                    {activeLogTab === "events"
                      ? (eventHistory[selectedSerial!] || []).map(
                          (entry, i) => (
                            <div
                              key={i}
                              onClick={() => setFocusedHistoryEvent(entry)}
                              className="p-3.5 border border-sky-500/10 rounded-2xl bg-sky-950/20 hover:border-sky-500/40 cursor-pointer flex gap-4 items-center transition-all hover:translate-x-1"
                            >
                              <Play
                                size={10}
                                className="text-sky-400"
                                fill="currentColor"
                              />
                              <div className="flex-1 overflow-hidden">
                                <span className="text-[8px] font-mono text-sky-500/50 block mb-0.5">
                                  {new Date(entry.timestamp).toLocaleTimeString(
                                    [],
                                    { hour12: false },
                                  )}
                                </span>
                                <p className="text-[10px] font-mono text-white/90 truncate uppercase tracking-tight">
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
                              className="p-3.5 border border-sky-500/10 rounded-2xl bg-sky-950/20 flex justify-between items-center text-[9px] font-mono hover:bg-sky-900/20 transition-all"
                            >
                              <span className="text-sky-500/50">
                                {new Date(entry.timestamp).toLocaleTimeString(
                                  [],
                                  { hour12: false },
                                )}
                              </span>
                              <span className="text-white font-bold">
                                SPD:{safeFixed(entry.speed, 0)} PWR:
                                {safeFixed(entry.power, 0)}%
                              </span>
                            </div>
                          ),
                        )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-16 text-center text-sky-500/20 font-futuristic uppercase tracking-[0.6em]">
              <Cpu className="w-16 h-16 mb-12 opacity-5 animate-pulse" />
              <p className="text-[11px] font-bold">AWAITING_LINK</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
