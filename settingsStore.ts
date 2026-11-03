import { create } from 'zustand';
// Public page preferences stay in this browser; no account or server is needed.
export const useSettingsStore = create(() => ({ settings: { language: 'zh' } }));
