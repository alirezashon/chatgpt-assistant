import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS } from '@/constants/storage';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEYS.settings], (items) => {
    if (chrome.runtime.lastError !== undefined) {
      return;
    }

    if (items[STORAGE_KEYS.settings] === undefined) {
      void chrome.storage.local.set({
        [STORAGE_KEYS.settings]: DEFAULT_SETTINGS,
      });
    }
  });
});
