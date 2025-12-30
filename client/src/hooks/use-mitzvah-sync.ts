import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useModalCompletionStore } from '@/lib/types';

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
    const response = await fetch('/api/user/mitzvah-progress', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modalCompletions, tzedakaCompletions })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error pushing cloud progress:', error);
    return false;
  }
}

export function useMitzvahSync() {
  const { session, isAuthenticated } = useAuth();
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  const hasSyncedRef = useRef(false);
  const lastSyncedDataRef = useRef<string>('');
  
  const syncToCloud = useCallback(async () => {
    if (!isAuthenticated || !session?.access_token) return;
    
    const serialized = serializeModalCompletions(completedModals);
    const dataString = JSON.stringify(serialized);
    
    if (dataString === lastSyncedDataRef.current) return;
    
    const tzedakaCompletions = getTzedakaCompletions();
    
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
    if (!isAuthenticated || !session?.access_token || hasSyncedRef.current) return;
    
    const syncOnLogin = async () => {
      hasSyncedRef.current = true;
      
      const cloudProgress = await fetchCloudProgress(session.access_token);
      
      if (cloudProgress && Object.keys(cloudProgress.modalCompletions).length > 0) {
        const merged = mergeModalCompletions(completedModals, cloudProgress.modalCompletions);
        
        const store = useModalCompletionStore.getState();
        const currentData = store.completedModals;
        
        for (const [date, data] of Object.entries(merged)) {
          if (!currentData[date]) {
            for (const modalId of Array.from(data.singles)) {
              store.markModalComplete(modalId);
            }
            for (const [modalId, count] of Object.entries(data.repeatables)) {
              const currentCount = store.getCompletionCount(modalId);
              for (let i = currentCount; i < count; i++) {
                store.markModalComplete(modalId);
              }
            }
          }
        }
        
        const updatedData = useModalCompletionStore.getState().completedModals;
        lastSyncedDataRef.current = JSON.stringify(serializeModalCompletions(updatedData));
        
        mergeTzedakaCompletions(cloudProgress.tzedakaCompletions);
      }
    };
    
    syncOnLogin();
  }, [isAuthenticated, session?.access_token]);
  
  useEffect(() => {
    if (!isAuthenticated || !session?.access_token) return;
    
    const timeoutId = setTimeout(() => {
      syncToCloud();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [completedModals, isAuthenticated, session?.access_token, syncToCloud]);
  
  return { syncToCloud };
}

function getTzedakaCompletions(): Record<string, Record<string, number>> {
  try {
    const stored = localStorage.getItem('tzedakaCompletions');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading tzedaka completions:', e);
  }
  return {};
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
    
    localStorage.setItem('tzedakaCompletions', JSON.stringify(merged));
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
    
    localStorage.setItem('tzedakaCompletions', JSON.stringify(current));
  } catch (e) {
    console.error('Error saving tzedaka completion:', e);
  }
}
