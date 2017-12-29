import * as Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import {DrawerActionTypes} from './DrawerActionTypes';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

const Point = Immutable.Record({x: 0, y: 0});

function plot(imageData, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
    return;
  }
  let i = (x + imageData.width * y) * 4;
  imageData.data[i] = r;
  imageData.data[i + 1] = g;
  imageData.data[i + 2] = b;
  imageData.data[i + 3] = a;
}

function drawLine(imageData, p0, p1) {
  let x0 = p0.get('x') | 0;
  let y0 = p0.get('y') | 0;
  let x1 = p1.get('x') | 0;
  let y1 = p1.get('y') | 0;
  let thickness = 1;

  plot(imageData, x0, y0, 0, 0, 0, 255);
  let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  if (steep) {
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }
  let deltaX = x1 - x0;
  let deltaY = Math.abs(y1 - y0);
  let error = deltaX >> 1;
  let stepY = y0 < y1 ? 1 : -1;
  let y = y0;
  let ps = [];
  {
    let _y = 0,
      _e = deltaX >> 1;
    for (let _x = 1; _x < thickness; _x++) {
      ps.push([_y, -_x]);
      _e -= deltaY;
      if (_e < 0) {
        _e += deltaX;
        _y += stepY;
      }
    }
  }
  for (let x = x0; x <= x1; x++) {
    if (steep) {
      plot(imageData, y, x, 0, 0, 0, 255);
      for (let [vx, vy] of ps) {
        plot(imageData, y + vy, x + vx, 0, 0, 0, 255);
        plot(imageData, y - vy, x - vx, 0, 0, 0, 255);
      }
    } else {
      plot(imageData, x, y, 0, 0, 0, 255);
      for (let [vx, vy] of ps) {
        plot(imageData, x + vx, y + vy, 0, 0, 0, 255);
        plot(imageData, x - vx, y - vy, 0, 0, 0, 255);
      }
    }
    error -= deltaY;
    if (error < 0) {
      error += deltaX;
      y += stepY;
      if (steep) {
        for (let [vx, vy] of ps) {
          plot(imageData, y + vy, x + vx, 0, 0, 0, 255);
          plot(imageData, y - vy, x - vx, 0, 0, 0, 255);
        }
      } else {
        for (let [vx, vy] of ps) {
          plot(imageData, x + vx, y + vy, 0, 0, 0, 255);
          plot(imageData, x - vx, y - vy, 0, 0, 0, 255);
        }
      }
    }
  }
}

const PictureState = Immutable.Record({
  imageData: null,
  previousPoint: null,
});

export class PictureStore extends ReduceStore {
  getInitialState() {
    return PictureState({
      imageData: new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    });
  }

  reduce(state, action) {
    switch (action.type) {
      case DrawerActionTypes.HANDLE_ON_MOUSE_DOWN: {
        const {x, y} = action.payload;
        return state.set('previousPoint', new Point({x, y}));
      }
      case DrawerActionTypes.HANDLE_ON_MOUSE_MOVE: {
        let previousPoint = state.get('previousPoint');
        if (!previousPoint) return state;
        const {x, y} = action.payload;
        let currentPoint = new Point({x, y});
        let imageData = state.get('imageData');
        drawLine(imageData, previousPoint, currentPoint);
        return state.set('previousPoint', currentPoint);
      }
      case DrawerActionTypes.HANDLE_ON_MOUSE_UP:
        return state.set('previousPoint', null);
      case DrawerActionTypes.CLEAR_CANVAS: {
        let imageData = state.get('imageData');
        return state.set('imageData', new ImageData(imageData.width, imageData.height));
      }
      default:
        return state;
    }
  }
}
