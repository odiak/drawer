import DrawerActionTypes from './DrawerActionTypes';
import DrawerDispatcher from './DrawerDispatcher';

const Actions = {
  handleOnMouseDown(x, y) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.HANDLE_ON_MOUSE_DOWN,
      x,
      y,
    });
  },

  handleOnMouseMove(x, y) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.HANDLE_ON_MOUSE_MOVE,
      x,
      y,
    });
  },

  handleOnMouseUp() {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.HANDLE_ON_MOUSE_UP,
    });
  },

  clearCanvas() {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.CLEAR_CANVAS,
    });
  },
};

export default Actions;