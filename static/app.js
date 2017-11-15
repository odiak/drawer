(() => {
  'use strict';

  const d = document;
  const width = 600;
  const height = 400;

  function on(node, name, func) {
    node.addEventListener(name, func);
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
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(event.offsetX, event.offsetY);
          ctx.stroke();
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
