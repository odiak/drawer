import React from 'react';
import {getOffset} from '../utils';

export const Canvas = (props) => {
  let imageData = props.picture.get('imageData');

  return (
    <canvas
      width={imageData.width}
      height={imageData.height}
      ref={(e) => {
        if (!e) return;
        e.getContext('2d').putImageData(imageData, 0, 0);
        e.ontouchstart = (event) => {
          event.preventDefault();
          event.stopPropagation();
          let {left, top} = getOffset(event.target);
          props.onMouseDown(
            event.touches[0].pageX - left,
            event.touches[0].pageY - top);
        };
        e.ontouchmove = (event) => {
          event.preventDefault();
          event.stopPropagation();
          let {left, top} = getOffset(event.target);
          props.onMouseMove(
            event.touches[0].pageX - left,
            event.touches[0].pageY - top);
        };
      }}
      onMouseDown={(event) => {
        props.handleOnMouseDown(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      }}
      onMouseMove={(e) => {
        props.handleOnMouseMove(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }}
      ></canvas>
  );
};
