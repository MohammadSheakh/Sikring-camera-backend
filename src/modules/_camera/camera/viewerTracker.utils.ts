// import { Map } from 'immutable';

// cameraId → Set of userIds currently watching
let activeViewers: Map<string, Set<string>> = new Map();

// Increment viewer count
export const addViewer = (cameraId: string, userId: string) => {
  const viewers = activeViewers.get(cameraId) || new Set<string>();
  viewers.add(userId);
  activeViewers.set(cameraId, viewers);
  
};

// Decrement viewer count
export const removeViewer = (cameraId: string, userId: string) => {
  const viewers = activeViewers.get(cameraId);
  if (viewers) {
    viewers.delete(userId);
    if (viewers.size === 0) {
      activeViewers.delete(cameraId);
    } else {
      activeViewers.set(cameraId, viewers);
    }
  }
  
};

// Get current viewer count
export const getViewerCount = (cameraId: string): number => {
  return activeViewers.get(cameraId)?.size || 0;
};

// Get list of active viewers
export const getActiveViewers = (cameraId: string): string[] => {
  return Array.from(activeViewers.get(cameraId) || new Set());
};

// Check if camera has any viewers
export const hasViewers = (cameraId: string): boolean => {
  return getViewerCount(cameraId) > 0;
};