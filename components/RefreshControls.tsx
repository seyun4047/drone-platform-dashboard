
import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { RefreshInterval } from '../types';

interface RefreshControlsProps {
  onManualRefresh: () => void;
  interval: RefreshInterval;
  onIntervalChange: (interval: RefreshInterval) => void;
  isRefreshing: boolean;
}

const RefreshControls: React.FC<RefreshControlsProps> = ({
  onManualRefresh,
  interval,
  onIntervalChange,
  isRefreshing
}) => {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-lg border border-sky-500/30">
      <div className="flex items-center gap-2 px-3 border-r border-sky-500/20">
        <Clock size={16} className="text-sky-400" />
        <select
          value={interval}
          onChange={(e) => onIntervalChange(Number(e.target.value))}
          className="bg-transparent text-[10px] font-futuristic text-sky-200 focus:outline-none appearance-none cursor-pointer uppercase"
        >
          <option value={RefreshInterval.OFF}>REFRESH: OFF</option>
          <option value={RefreshInterval.SEC_1}>1s</option>
          <option value={RefreshInterval.SEC_3}>3s</option>
          <option value={RefreshInterval.SEC_5}>5s</option>
          <option value={RefreshInterval.SEC_10}>10s</option>
          <option value={RefreshInterval.SEC_30}>30s</option>
        </select>
      </div>
      
      <button
        onClick={onManualRefresh}
        disabled={isRefreshing}
        className={`p-2 rounded-md hover:bg-sky-500/20 transition-all flex items-center gap-2 ${isRefreshing ? 'opacity-50 cursor-wait' : ''}`}
      >
        <RefreshCw size={18} className={`text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="text-[10px] font-futuristic text-sky-400 hidden sm:inline uppercase tracking-widest">Sync</span>
      </button>
    </div>
  );
};

export default RefreshControls;
