export const DrawerActionTypes = {
  PUSH_HISTORY: null,
  HANDLE_ON_MOUSE_DOWN: null,
  HANDLE_ON_MOUSE_MOVE: null,
  HANDLE_ON_MOUSE_UP: null,
  CLEAR_CANVAS: null,
};

for (const key in DrawerActionTypes) {
  DrawerActionTypes[key] = key;
}
