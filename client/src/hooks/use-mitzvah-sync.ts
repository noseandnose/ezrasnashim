import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useModalCompletionStore } from '@/lib/types';
import { create } from 'zustand';

const useSyncTrigger = create<{ counter: number; trigger: () => void }>((set) => ({
  counter: 0,
  trigger: () => set((state) => ({ counter: state.counter + 1 }))
}));

export const triggerMitzvahSync = () => useSyncTrigger.getState().trigger();

interface CloudProgress {
  modalCompletions: Record<string, { singles: string[]; repeatables: Record<string, number> }>;
  tzedakaCompletions: Record<string, Record<string, number>>;
  version: number;
}

function serializeModalCompletions(
  completedModals: Record<string, { singles: Set<string>; repeatables: Record<string, number> }>
): Record<string, { singles: string[]; repeatables: Record<string, number> }> {
  const result: Record<string, { singles: string[]; repeatables: Record<string, number> }> = {};
  for (const [date, data] of Object.entries(completedModals)) {
    result[date] = {
      singles: Array.from(data.singles),
      repeatables: { ...data.repeatables }
    };
  }
  return result;
}

function mergeModalCompletions(
  local: Record<string, { singles: Set<string>; repeatables: Record<string, number> }>,
  cloud: Record<string, { singles: string[]; repeatables: Record<string, number> }>
): Record<string, { singles: Set<string>; repeatables: Record<string, number> }> {
  const result: Record<string, { singles: Set<string>; repeatables: Record<string, number> }> = {};
  const allDates = Array.from(new Set([...Object.keys(local), ...Object.keys(cloud)]));
  
  for (const date of allDates) {
    const localData = local[date];
    const cloudData = cloud[date];
    
    if (!localData && cloudData) {
      result[date] = {
        singles: new Set(cloudData.singles || []),
        repeatables: cloudData.repeatables ? { ...cloudData.repeatables } : {}
      };
    } else if (localData && !cloudData) {
      result[date] = {
        singles: new Set(Array.from(localData.singles)),
        repeatables: { ...localData.repeatables }
      };
    } else if (localData && cloudData) {
      const localSinglesArr = Array.from(localData.singles);
      const mergedSingles = new Set([...localSinglesArr, ...(cloudData.singles || [])]);
      const mergedRepeatables: Record<string, number> = {};
      
      const allRepeatableKeys = Array.from(new Set([
        ...Object.keys(localData.repeatables || {}),
        ...Object.keys(cloudData.repeatables || {})
      ]));
      
      for (const key of allRepeatableKeys) {
        mergedRepeatables[key] = Math.max(
          localData.repeatables?.[key] || 0,
          cloudData.repeatables?.[key] || 0
        );
      }
      
      result[date] = {
        singles: mergedSingles,
        repeatables: mergedRepeatables
      };
    }
  }
  
  return result;
}

async function fetchCloudProgress(accessToken: string): Promise<CloudProgress | null> {
  try {
    const response = await fetch('/api/user/mitzvah-progress', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) return null;
      throw new Error('Failed to fetch cloud progress');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching cloud progress:', error);
    return null;
  }
}

async function pushCloudProgress(
  accessToken: string,
  modalCompletions: Record<string, { singles: string[]; repeatables: Record<string, number> }>,
  tzedakaCompletions: Record<string, Record<string, number>>
): Promise<boolean> {
  try {
    console.log('[MitzvahSync] Pushing to cloud:', {
      modalDates: Object.keys(modalCompletions).length,
      tzedakaDates: Object.keys(tzedakaCompletions).length
    });
    
    const response = await fetch('/api/user/mitzvah-progress', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modalCompletions, tzedakaCompletions })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MitzvahSync] Push failed:', response.status, errorText);
      return false;
    }
    
    console.log('[MitzvahSync] Push successful');
    return true;
  } catch (error) {
    console.error('[MitzvahSync] Error pushing cloud progress:', error);
    return false;
  }
}

export function useMitzvahSync() {
  const { session, isAuthenticated } = useAuth();
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  const syncTriggerCounter = useSyncTrigger((state) => state.counter);
  const hasSyncedRef = useRef(false);
  const lastSyncedDataRef = useRef<string>('');
  const prevAuthRef = useRef(isAuthenticated);
  
  // Reset sync state when user logs out so re-login triggers sync
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      console.log('[MitzvahSync] User logged out, resetting sync state');
      hasSyncedRef.current = false;
      lastSyncedDataRef.current = '';
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);
  
  const syncToCloud = useCallback(async () => {
    if (!isAuthenticated || !session?.access_token) return;
    
    const serialized = serializeModalCompletions(completedModals);
    const tzedakaCompletions = getTzedakaCompletions();
    const dataString = JSON.stringify({ modals: serialized, tzedaka: tzedakaCompletions });
    
    if (dataString === lastSyncedDataRef.current) return;
    
    const success = await pushCloudProgress(
      session.access_token,
      serialized,
      tzedakaCompletions
    );
    
    if (success) {
      lastSyncedDataRef.current = dataString;
    }
  }, [isAuthenticated, session?.access_token, completedModals]);
  
  useEffect(() => {
    if (!isAuthenticated || !session?.access_token || hasSyncedRef.current) {
      if (hasSyncedRef.current) {
        console.log('[MitzvahSync] Skipping login sync - already synced this session');
      }
      return;
    }
    
    const syncOnLogin = async () => {
      console.log('[MitzvahSync] Starting login sync...');
      hasSyncedRef.current = true;
      
      // Migrate legacy tzedaka key if needed
      migrateLegacyTzedakaKey();
      
      const cloudProgress = await fetchCloudProgress(session.access_token);
      console.log('[MitzvahSync] Cloud progress fetched:', cloudProgress ? {
        modalDates: Object.keys(cloudProgress.modalCompletions).length,
        tzedakaDates: Object.keys(cloudProgress.tzedakaCompletions).length,
        version: cloudProgress.version
      } : 'null');
      
      // Get current local state
      const localModals = useModalCompletionStore.getState().completedModals;
      
      if (cloudProgress) {
        // Merge cloud data with local if cloud has data
        if (Object.keys(cloudProgress.modalCompletions).length > 0) {
          const merged = mergeModalCompletions(localModals, cloudProgress.modalCompletions);
          
          const store = useModalCompletionStore.getState();
          
          for (const [date, data] of Object.entries(merged)) {
            store.setCompletionsForDate(date, data);
          }
        }
        
        if (cloudProgress.tzedakaCompletions && Object.keys(cloudProgress.tzedakaCompletions).length > 0) {
          mergeTzedakaCompletions(cloudProgress.tzedakaCompletions);
        }
      }
      
      // Get the final merged state
      const updatedModals = useModalCompletionStore.getState().completedModals;
      const updatedTzedaka = getTzedakaCompletions();
      const serializedModals = serializeModalCompletions(updatedModals);
      const dataString = JSON.stringify({ 
        modals: serializedModals, 
        tzedaka: updatedTzedaka 
      });
      
      // If local has data that cloud doesn't, push to cloud immediately
      const hasLocalData = Object.keys(updatedModals).length > 0 || Object.keys(updatedTzedaka).length > 0;
      const cloudWasEmpty = !cloudProgress || 
        (Object.keys(cloudProgress.modalCompletions).length === 0 && 
         Object.keys(cloudProgress.tzedakaCompletions).length === 0);
      
      if (hasLocalData && cloudWasEmpty) {
        console.log('[MitzvahSync] Pushing local data to empty cloud...');
        const success = await pushCloudProgress(session.access_token, serializedModals, updatedTzedaka);
        if (success) {
          lastSyncedDataRef.current = dataString;
        }
      } else {
        // Cloud had data, set ref to merged state
        lastSyncedDataRef.current = dataString;
      }
    };
    
    syncOnLogin();
  }, [isAuthenticated, session?.access_token]);
  
  useEffect(() => {
    if (!isAuthenticated || !session?.access_token) return;
    
    const tzedakaData = getTzedakaCompletions();
    const serialized = serializeModalCompletions(completedModals);
    const currentData = JSON.stringify({ modals: serialized, tzedaka: tzedakaData });
    
    if (currentData === lastSyncedDataRef.current) return;
    
    const timeoutId = setTimeout(() => {
      syncToCloud();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [completedModals, syncTriggerCounter, isAuthenticated, session?.access_token, syncToCloud]);
  
  return { syncToCloud };
}

function getTzedakaCompletions(): Record<string, Record<string, number>> {
  try {
    const stored = localStorage.getItem('tzedaka_button_completions');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading tzedaka completions:', e);
  }
  return {};
}

function migrateLegacyTzedakaKey(): void {
  try {
    const legacyKey = 'tzedakaCompletions';
    const newKey = 'tzedaka_button_completions';
    
    const legacyData = localStorage.getItem(legacyKey);
    if (!legacyData) return;
    
    const existingData = localStorage.getItem(newKey);
    
    if (!existingData) {
      localStorage.setItem(newKey, legacyData);
    } else {
      const legacy = JSON.parse(legacyData);
      const current = JSON.parse(existingData);
      
      for (const [date, data] of Object.entries(legacy)) {
        if (!current[date]) {
          current[date] = data;
        } else {
          for (const [key, count] of Object.entries(data as Record<string, number>)) {
            current[date][key] = Math.max(current[date][key] || 0, count);
          }
        }
      }
      
      localStorage.setItem(newKey, JSON.stringify(current));
    }
    
    localStorage.removeItem(legacyKey);
    console.log('Migrated legacy tzedaka data');
  } catch (e) {
    console.error('Error migrating legacy tzedaka key:', e);
  }
}

function mergeTzedakaCompletions(
  cloudData: Record<string, Record<string, number>>
): void {
  try {
    const local = getTzedakaCompletions();
    const allDates = Array.from(new Set([...Object.keys(local), ...Object.keys(cloudData)]));
    const merged: Record<string, Record<string, number>> = {};
    
    for (const date of allDates) {
      const localDay = local[date] || {};
      const cloudDay = cloudData[date] || {};
      const allKeys = Array.from(new Set([...Object.keys(localDay), ...Object.keys(cloudDay)]));
      
      merged[date] = {};
      for (const key of allKeys) {
        merged[date][key] = Math.max(localDay[key] || 0, cloudDay[key] || 0);
      }
    }
    
    localStorage.setItem('tzedaka_button_completions', JSON.stringify(merged));
  } catch (e) {
    console.error('Error merging tzedaka completions:', e);
  }
}

export function saveTzedakaCompletion(type: string): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = getTzedakaCompletions();
    
    if (!current[today]) {
      current[today] = {};
    }
    current[today][type] = (current[today][type] || 0) + 1;
    
    localStorage.setItem('tzedaka_button_completions', JSON.stringify(current));
    
    triggerMitzvahSync();
  } catch (e) {
    console.error('Error saving tzedaka completion:', e);
  }
}
