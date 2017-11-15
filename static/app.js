(() => {
  'use strict';

  const d = document;
  const width = 600;
  const height = 400;

  function on(node, name, func) {
    node.addEventListener(name, func);
  }

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

  function drawLine(ctx, x0, y0, x1, y1, thickness) {
    let imageData = ctx.getImageData(0, 0, width, height);

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
      let _y = 0, _e = deltaX >> 1;
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
        ps.forEach(([vx, vy]) => {
          plot(imageData, y + vy, x + vx, 0, 0, 0, 255);
          plot(imageData, y - vy, x - vx, 0, 0, 0, 255);
        });
      } else {
        plot(imageData, x, y, 0, 0, 0, 255);
        ps.forEach(([vx, vy]) => {
          plot(imageData, x + vx, y + vy, 0, 0, 0, 255);
          plot(imageData, x - vx, y - vy, 0, 0, 0, 255);
        });
      }
      error -= deltaY;
      if (error < 0) {
        error += deltaX;
        y += stepY;
        if (steep) {
          ps.forEach(([vx, vy]) => {
            plot(imageData, y + vy, x + vx, 0, 0, 0, 255);
            plot(imageData, y - vy, x - vx, 0, 0, 0, 255);
          });
        } else {
          ps.forEach(([vx, vy]) => {
            plot(imageData, x + vx, y + vy, 0, 0, 0, 255);
            plot(imageData, x - vx, y - vy, 0, 0, 0, 255);
          });
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  on(window, 'load',() => {
    const canvas = d.getElementById('canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = height;

      if (canvas.dataset.imageUrl) {
        let img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = canvas.dataset.imageUrl;
      }

      let prevPoint = null;

      on(canvas, 'mousedown', (event) => {
        prevPoint = {x: event.offsetX, y: event.offsetY};
      });
      on(canvas, 'mousemove', (event) => {
        if (prevPoint) {
          drawLine(ctx, prevPoint.x, prevPoint.y, event.offsetX, event.offsetY, 2);
          prevPoint = {x: event.offsetX, y: event.offsetY};
        }
      });
      on(document.body, 'mouseup', (event) => {
        prevPoint = null;
      });

      const clearButton = d.getElementById('clear');
      on(clearButton, 'click', () => {
        ctx.clearRect(0, 0, width, height);
      });

      const imageInput = d.querySelector('input[name=image]');

      on(document.forms[0], 'submit', (event) => {
        const imageURL = canvas.toDataURL('image/png');
        imageInput.value = imageURL.slice(22);
      });
    }
  });
})();
