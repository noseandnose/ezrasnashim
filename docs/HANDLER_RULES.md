# FlutterFlow WebView - Correct Handler Rules

## The Core Problem
`onPointerDown` fires IMMEDIATELY when finger touches screen, before the gesture is complete.
This causes:
1. **Double-firing**: pointerDown triggers action, then synthetic click may also fire
2. **Touch pass-through**: Action fires, modal closes, touch continues to element behind
3. **Resume issues**: Pointer state can get stuck after background/foreground

## Handler Rules by Component Type

### A) Simple Tap Actions (navigate, open modal, menu items)
**Use: `onClick`**
- Fires after touchEnd/mouseUp - user intended to tap
- Natural debouncing - won't fire during scroll
- Works consistently across touch/mouse/keyboard

### B) Primary Action Buttons (submit, save, complete)
**Use: `onClick`**
- Critical actions should NEVER use onPointerDown
- Prevents accidental triggers from touch-and-drag-away
- Button's disabled state works correctly with onClick

### C) Toggle Controls (switches, checkboxes)
**Use: `onClick`**
- Standard for form controls
- Provides accessibility (keyboard activation)

### D) Elements in Scrollable Containers
**Use: `TapButton` / `TapDiv` OR `onClick`**
- TapButton/TapDiv include scroll detection (10px threshold)
- If movement detected, tap is cancelled
- Prevents accidental taps while scrolling

### E) Drag/Gesture Controls (sliders, progress bars)
**Use: Pointer events (pointerDown/pointerMove/pointerUp)**
- These need continuous tracking during drag
- Use setPointerCapture for reliable tracking
- ONLY case where pointerDown is appropriate

### F) Modal Backdrops/Overlays
**Use: `onClick`**
- Prevents early dismissal from pointerDown
- User can touch backdrop and drag away to cancel

### G) Close Buttons (X buttons)
**Use: `onClick`**
- Same as action buttons - wait for full tap gesture

### H) Font Size / Language Toggles (non-destructive)
**Use: `onClick`**
- These don't close modals, so less critical
- But still use onClick for consistency

## Resume Handling
All interactive components should:
1. Listen for `visibilitychange` and `pageshow` events
2. Reset any stuck states (pressed, dragging, etc.)
3. Clear pointer captures
4. Re-enable click handlers that may have been blocked

## Implementation
- Replace all `onPointerDown` with `onClick` EXCEPT for drag controls
- Use `TapButton`/`TapDiv` for items in scrollable lists
- Ensure no duplicate handlers (don't have both pointer and click)
