import {DrawerActionTypes} from './DrawerActionTypes';
import {DrawerDispatcher} from './DrawerDispatcher';
import {imageDataToBase64StringOfPng, getCookie} from '../utils';
import request from 'superagent';

export const DrawerActions = {
  pushHistory(path) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.PUSH_HISTORY,
      payload: {
        path,
      },
    });
  },

  handleOnMouseDown(x, y) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.HANDLE_ON_MOUSE_DOWN,
      payload: {
        x,
        y,
      },
    });
  },

  handleOnMouseMove(x, y) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.HANDLE_ON_MOUSE_MOVE,
      payload: {
        x,
        y,
      },
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

  savePicture(imageData) {
    imageDataToBase64StringOfPng(imageData).then((encodedImage) => {
      request
        .post('/api/pictures')
        .type('form')
        .set('X-CSRF-TOKEN', getCookie('CSRF-TOKEN'))
        .send({image: encodedImage})
        .then((res) => {
          console.log(res);
        });
    });
  },

  changeTool(tool) {
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.CHANGE_TOOL,
      payload: {
        tool,
      },
    });
  },
};
