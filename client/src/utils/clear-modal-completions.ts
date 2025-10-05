// Utility to clear modal completion data
export function clearModalCompletions() {
  try {
    localStorage.removeItem('modalCompletions');
    if (import.meta.env.DEV) {
      console.log('Modal completions cleared successfully');
    }
    return true;
  } catch (error) {
    console.error('Failed to clear modal completions:', error);
    return false;
  }
}

// Auto-clear on first load if needed (temporary fix)
if (typeof window !== 'undefined') {
  const clearFlag = localStorage.getItem('modalCompletions_cleared_aug21');
  if (!clearFlag) {
    clearModalCompletions();
    localStorage.setItem('modalCompletions_cleared_aug21', 'true');
    if (import.meta.env.DEV) {
      console.log('One-time modal completions clear performed');
    }
  }
}