export const DrawerActionTypes = {
  PUSH_HISTORY: '',
  HANDLE_ON_MOUSE_DOWN: '',
  HANDLE_ON_MOUSE_MOVE: '',
  HANDLE_ON_MOUSE_UP: '',
  CLEAR_CANVAS: '',
  CHANGE_TOOL: '',
};

for (const key in DrawerActionTypes) {
  DrawerActionTypes[key] = key;
}

Object.freeze(DrawerActionTypes);
