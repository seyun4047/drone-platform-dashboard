import React from "react";
import {
  Battery,
  Wind,
  ShieldAlert,
  MapPin,
  ChevronRight,
  Activity,
  AlertCircle,
} from "lucide-react";
import { DroneInfo } from "../types";

interface DroneCardProps {
  drone: DroneInfo;
  onClick: (serial: string) => void;
  isSelected?: boolean;
  unreadCount?: number;
}

/**
 * DroneCard displays a summary of telemetry data for an individual drone unit.
 */
const DroneCard: React.FC<DroneCardProps> = ({
  drone,
  onClick,
  isSelected,
  unreadCount = 0,
}) => {
  const { telemetry, event } = drone;

  const renderValue = (val: any, unit: string = "") => {
    if (val === undefined || val === null) return "N/A";
    return typeof val === "number"
      ? `${val.toFixed(val % 1 === 0 ? 0 : 1)}${unit}`
      : val;
  };

  return (
    <div
      onClick={() => onClick(drone.serial)}
      className={`glass group relative overflow-hidden transition-all duration-300 rounded-2xl p-4 flex flex-col min-[851px]:flex-row items-stretch min-[851px]:items-center gap-5 cursor-pointer border ${
        isSelected
          ? "border-sky-400 bg-sky-500/10 shadow-[0_0_30px_rgba(14,165,233,0.25)]"
          : "hover:border-sky-400/60 border-sky-500/10"
      }`}
    >
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-bounce border border-white/20">
          <AlertCircle size={10} />
          <span className="text-[10px] font-bold font-mono leading-none">
            {unreadCount}
          </span>
        </div>
      )}

      {/* Information Section */}
      <div className="flex-1 flex flex-col min-[1201px]:flex-row min-[1201px]:items-center gap-4">
        {/* Name and ID */}
        <div className="min-w-[140px] max-w-[180px] shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
              <div className="absolute inset-0 w-full h-full rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <h3 className="font-futuristic text-sm min-[1400px]:text-lg text-white glow-text-blue uppercase tracking-tighter truncate">
              {drone.name}
            </h3>
          </div>
          {/* <span className="text-[9px] text-sky-500/40 font-mono uppercase tracking-[0.2em] block">
            ID: {drone.serial.slice(-6)}
          </span> */}
        </div>

        {/* Telemetry Metrics - Improved for no overlapping */}
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 min-[1201px]:gap-x-10 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Power */}
          {/* <div className="flex flex-col gap-1 min-w-[60px]"> */}
          <div className="flex flex-col gap-1 min-w-[80px] border-l border-sky-500/10 pl-4">
            <div className="flex items-center gap-1.5 text-sky-500/60 text-[8px] font-futuristic uppercase">
              <Battery className="text-sky-400 w-3 h-3" /> PWR
            </div>
            <div
              className={`text-base font-bold font-mono tracking-tighter ${(telemetry?.power || 0) < 20 ? "text-red-400 animate-pulse" : "text-sky-100"}`}
            >
              {renderValue(telemetry?.power)}
              <span className="text-[10px] ml-0.5 opacity-50">%</span>
            </div>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1 min-w-[80px] border-l border-sky-500/10 pl-4">
            <div className="flex items-center gap-1.5 text-sky-500/60 text-[8px] font-futuristic uppercase">
              <Wind className="text-sky-400 w-3 h-3" /> SPD
            </div>
            <div className="text-base font-bold text-sky-100 font-mono tracking-tighter">
              {renderValue(telemetry?.speed)}
              <span className="text-[10px] ml-0.5 opacity-50 uppercase">
                km/h
              </span>
            </div>
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1 min-w-[120px] border-l border-sky-500/10 pl-4">
            <div className="flex items-center gap-1.5 text-sky-500/60 text-[8px] font-futuristic uppercase">
              <MapPin className="text-sky-400 w-3 h-3" /> POSITION
            </div>
            <div className="text-[15px] font-bold text-sky-300 font-mono leading-tight uppercase tracking-tight">
              {telemetry?.latitude?.toFixed(4)}{" "}
              <span className="opacity-30">/</span>{" "}
              {telemetry?.longitude?.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Feed */}
      <div className="shrink-0 relative group/img mt-1 min-[851px]:mt-0">
        <div className="relative overflow-hidden border border-sky-500/20 bg-black shadow-lg rounded-xl w-full min-[851px]:w-44 min-[1201px]:w-56 min-[1400px]:w-64 aspect-video">
          {event?.event_detail?.image ? (
            <img
              src={event.event_detail.image}
              className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-110 transition-all duration-700"
              alt="feed"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-500/40 bg-slate-950">
              <ShieldAlert className="w-6 h-6 animate-pulse mb-1" />
              <span className="text-[7px] font-futuristic tracking-widest uppercase opacity-60">
                Signal Lost
              </span>
            </div>
          )}
          <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-20"></div>

          {/* Overlay Status */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded border border-sky-500/30 text-[7px] font-mono text-sky-400">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
            CAM_01_FEED
          </div>

          <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-sky-500 text-slate-950 px-4 py-1.5 rounded-lg font-futuristic text-[9px] flex items-center gap-2 uppercase font-bold tracking-[0.2em] shadow-lg">
              Analyze <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneCard;
