import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TIME_ZONES } from '../utils/timeZoneUtils';

interface TimeZoneState {
  adminTimeZone: string;
  setAdminTimeZone: (timeZone: string) => void;
}

export const useTimeZoneStore = create<TimeZoneState>()(
  persist(
    (set) => ({
      adminTimeZone: TIME_ZONES.MMT, // Default to Myanmar Time
      setAdminTimeZone: (timeZone) => set({ adminTimeZone: timeZone })
    }),
    {
      name: 'time-zone-store'
    }
  )
);