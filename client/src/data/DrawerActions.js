import DrawerActionTypes from './DrawerActionTypes';
import DrawerDispatcher from './DrawerDispatcher';
import history from '../history';
import {imageDataToBase64StringOfPng, getCookie} from '../utils';
import request from 'superagent';

const Actions = {
  pushHistory(path) {
    if (path !== history.location.pathname) {
      history.push(path);
    }
    DrawerDispatcher.dispatch({
      type: DrawerActionTypes.PUSH_HISTORY,
      path,
    });
  },

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

  savePicture(imageData) {
    imageDataToBase64StringOfPng(imageData).then((encodedImage) => {
      console.log(encodedImage);
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
};

export default Actions;
