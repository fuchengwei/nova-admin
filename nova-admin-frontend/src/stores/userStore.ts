import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, MenuInfo } from '@/types/api';

interface UserState {
  userInfo: UserInfo | null;
  menus: MenuInfo[];
  permissions: string[];
  roles: string[];
  setUserInfo: (user: UserInfo | null) => void;
  setMenus: (menus: MenuInfo[]) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      menus: [],
      permissions: [],
      roles: [],
      setUserInfo: (userInfo) =>
        set({
          userInfo: userInfo,
          permissions: userInfo?.permissions ?? [],
          roles: userInfo?.roles ?? [],
        }),
      setMenus: (menus) => set({ menus }),
      reset: () => set({ userInfo: null, menus: [], permissions: [], roles: [] }),
    }),
    {
      name: 'nova-user',
      // 只持久化 userInfo，menus/permissions/roles 每次挂载时从服务端拉取
      partialize: (state) => ({ userInfo: state.userInfo }),
    },
  ),
);
