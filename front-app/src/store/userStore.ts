import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';

interface UserStore {
  profile: UserProfile | null;
  isProfileLoaded: boolean;
  setProfile: (profile: UserProfile | null) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      isProfileLoaded: false,
      setProfile: (profile) => set({ profile, isProfileLoaded: true }),
      clearProfile: () => set({ profile: null, isProfileLoaded: false }),
    }),
    { name: 'user-profile' }
  )
);
