import * as Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import {DrawerActionTypes} from './DrawerActionTypes';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

const Point = Immutable.Record({x: 0, y: 0});

function plot(imageData, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
    return;
  }
  let i = (x + imageData.width * y) * 4;
  imageData.data[i] = r;
  imageData.data[i + 1] = g;
  imageData.data[i + 2] = b;
  imageData.data[i + 3] = a;
}

function drawLine(imageData, p0, p1, color) {
  let x0 = p0.get('x') | 0;
  let y0 = p0.get('y') | 0;
  let x1 = p1.get('x') | 0;
  let y1 = p1.get('y') | 0;
  let thickness = 1;

  plot(imageData, x0, y0, color);
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
      plot(imageData, y, x, color);
      for (let [vx, vy] of ps) {
        plot(imageData, y + vy, x + vx, color);
        plot(imageData, y - vy, x - vx, color);
      }
    } else {
      plot(imageData, x, y, color);
      for (let [vx, vy] of ps) {
        plot(imageData, x + vx, y + vy, color);
        plot(imageData, x - vx, y - vy, color);
      }
    }
    error -= deltaY;
    if (error < 0) {
      error += deltaX;
      y += stepY;
      if (steep) {
        for (let [vx, vy] of ps) {
          plot(imageData, y + vy, x + vx, color);
          plot(imageData, y - vy, x - vx, color);
        }
      } else {
        for (let [vx, vy] of ps) {
          plot(imageData, x + vx, y + vy, color);
          plot(imageData, x - vx, y - vy, color);
        }
      }
    }
  }
}

function colorAt(imageData, x, y) {
  const i = (imageData.width * y + x) * 4;
  const d = imageData.data;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
}

function sameColor(c1, c2) {
  return (
    (c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]) ||
    (c1[3] === c2[3] && c1[3] === 0) // transparent
  );
}

function fill(imageData, x, y, color) {
  const colorAtPoint = colorAt(imageData, x, y);
  if (sameColor(colorAtPoint, color)) {
    return;
  }
  const q = [{x, y}];
  while (q.length > 0) {
    const {x, y} = q.shift();
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
      continue;
    }

    if (sameColor(colorAtPoint, colorAt(imageData, x, y))) {
      plot(imageData, x, y, color);
      q.push({x: x - 1, y});
      q.push({x: x + 1, y});
      q.push({x, y: y - 1});
      q.push({x, y: y + 1});
    }
  }
}

function checksum(imageData) {
  let result = 0;
  for (const n of imageData.data) {
    result = (31 * result + n) | 0;
  }
  return result;
}

class PictureState extends Immutable.Record({
  checksum: 0,
  imageData: null,
  previousPoint: null,
  currentTool: 'pen',
  currentColor: Immutable.List.of(0, 0, 0, 0),
}) {}

export class PictureStore extends ReduceStore {
  getInitialState() {
    return new PictureState({
      imageData: new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT),
      currentColor: Immutable.List.of(0, 0, 0, 255),
    });
  }

  reduce(state, action) {
    switch (action.type) {
      case DrawerActionTypes.HANDLE_ON_MOUSE_DOWN:
        return this.handleMouseDown(state, action);

      case DrawerActionTypes.HANDLE_ON_MOUSE_MOVE:
        return this.handleMouseMove(state, action);

      case DrawerActionTypes.HANDLE_ON_MOUSE_UP:
        return this.handleMouseUp(state, action);

      case DrawerActionTypes.CLEAR_CANVAS: {
        let imageData = state.get('imageData');
        return state.set('imageData', new ImageData(imageData.width, imageData.height));
      }

      case DrawerActionTypes.CHANGE_TOOL:
        return state.set('currentTool', action.payload.tool);

      case DrawerActionTypes.CHANGE_COLOR:
        return state.set('currentColor', Immutable.List.of(...action.payload.color));

      default:
        return state;
    }
  }

  handleMouseDown(state, {payload: {x, y}}) {
    switch (state.currentTool) {
      case 'pen':
        return state.set('previousPoint', new Point({x, y}));
      case 'fill':
        fill(state.imageData, x, y, state.currentColor.toJS());
        return state.set('checksum', checksum(state.imageData));
      default:
        return state;
    }
  }

  handleMouseMove(state, {payload: {x, y}}) {
    switch (state.currentTool) {
      case 'pen': {
        let previousPoint = state.get('previousPoint');
        if (!previousPoint) return state;
        let currentPoint = new Point({x, y});
        let imageData = state.get('imageData');
        drawLine(imageData, previousPoint, currentPoint, state.currentColor.toJS());
        return state.set('previousPoint', currentPoint);
      }
      default:
        return state;
    }
  }

  handleMouseUp(state, {payload}) {
    switch (state.currentTool) {
      case 'pen':
        return state.set('previousPoint', null);
      default:
        return state;
    }
  }
}
