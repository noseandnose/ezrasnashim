// Utility to clear modal completion data
export function clearModalCompletions() {
  try {
    localStorage.removeItem('modalCompletions');
    return true;
  } catch (error) {
    return false;
  }
}

// Auto-clear on first load if needed (temporary fix)
if (typeof window !== 'undefined') {
  const clearFlag = localStorage.getItem('modalCompletions_cleared_aug21');
  if (!clearFlag) {
    clearModalCompletions();
    localStorage.setItem('modalCompletions_cleared_aug21', 'true');
  }
}