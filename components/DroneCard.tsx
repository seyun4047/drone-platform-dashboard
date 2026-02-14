
import React from 'react';
import { Battery, Wind, ShieldAlert, MapPin, ChevronRight } from 'lucide-react';
import { DroneInfo } from '../types';

interface DroneCardProps {
  drone: DroneInfo;
  onClick: (serial: string) => void;
  isSelected?: boolean;
}

/**
 * DroneCard displays a summary of telemetry data for an individual drone unit.
 */
const DroneCard: React.FC<DroneCardProps> = ({ drone, onClick, isSelected }) => {
  const { telemetry, event } = drone;

  /**
   * Formats values for display. Returns 'N/A' if value is missing.
   */
  const renderValue = (val: any, unit: string = '') => {
    if (val === undefined || val === null) return 'N/A';
    return typeof val === 'number' ? `${val.toFixed(val % 1 === 0 ? 0 : 2)}${unit}` : val;
  };

  return (
    <div 
      onClick={() => onClick(drone.serial)}
      className={`glass group relative overflow-hidden transition-all duration-300 rounded-xl p-4 flex flex-col lg:flex-row gap-6 items-center cursor-pointer border ${
        isSelected 
          ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.3)]' 
          : 'hover:border-sky-400/60 border-sky-500/20'
      }`}
    >
      {/* Name and Serial Identification */}
      <div className="w-full lg:w-48 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
          <h3 className="font-futuristic text-lg text-white glow-text-blue uppercase tracking-tighter">{drone.name}</h3>
        </div>
        <p className="text-[10px] text-sky-400 font-mono tracking-wider bg-sky-950/40 p-1.5 rounded border border-sky-800/50">
          ID: {drone.serial}
        </p>
      </div>

      {/* Telemetry Data Summary - Person Count (Entities) removed as requested */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sky-500/70 text-[10px] font-futuristic uppercase">
            <Battery size={12} /> Power
          </div>
          <div className={`text-xl font-bold font-mono ${(telemetry?.power || 0) < 20 && telemetry?.power !== null ? 'text-red-400' : 'text-sky-100'}`}>
            {renderValue(telemetry?.power, '%')}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sky-500/70 text-[10px] font-futuristic uppercase">
            <Wind size={12} /> Velocity
          </div>
          <div className="text-xl font-bold text-sky-100 font-mono">{renderValue(telemetry?.speed, 'km/h')}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sky-500/70 text-[10px] font-futuristic uppercase">
            <MapPin size={12} /> Position
          </div>
          <div className="text-[10px] font-bold text-sky-300 font-mono leading-tight">
            LAT: {telemetry?.latitude?.toFixed(4) ?? 'N/A'}<br/>
            LNG: {telemetry?.longitude?.toFixed(4) ?? 'N/A'}
          </div>
        </div>
      </div>

      {/* Event Preview Feed */}
      <div className="w-full lg:w-48 shrink-0 relative group/img">
        <div className="aspect-video relative overflow-hidden rounded-lg border border-sky-500/20 bg-black/40">
          {event?.event_detail?.image ? (
            <img 
              src={event.event_detail.image} 
              alt="Live Feed" 
              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            /* Visual feedback for missing signal/image */
            <div className="w-full h-full flex flex-col items-center justify-center text-red-500/40 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.1)_0%,_transparent_70%)] relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                 <div className="w-full h-[1px] bg-red-500 rotate-12"></div>
                 <div className="w-full h-[1px] bg-red-500 -rotate-12 absolute"></div>
              </div>
              <ShieldAlert size={32} className="animate-pulse" />
              <span className="text-[10px] mt-2 font-futuristic tracking-[0.2em]">NO SIGNAL</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
             <span className="text-[10px] font-futuristic text-sky-400 flex items-center gap-1">
                SYSTEM LOGS <ChevronRight size={12} />
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneCard;
