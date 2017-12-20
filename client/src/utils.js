import {PNG} from 'pngjs';
import {encode as Base64Encode} from 'base64-stream';

export function getOffset(node) {
  let left = 0, top = 0;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return {left, top};
}

export function imageDataToBase64StringOfPng(imageData) {
  let png = new PNG({
    width: imageData.width,
    height: imageData.height,
  });
  for (let i = 0, n = imageData.data.length; i < n; i++) {
    png.data[i] = imageData.data[i];
  }
  let s = '';
  return new Promise((resolve, reject) => {
    png.pack().pipe(new Base64Encode()).on('data', (data) => {
      for (let i = 0; i < data.length; i++) {
        s += String.fromCharCode(data[i]);
      }
    }).on('end', () => {
      resolve(s);
    });
  });
}

export function getCookie(name) {
  const escapedName = encodeURIComponent(name).replace(/[\-\.\+\*]/g, '\\$&');
  return document.cookie.replace(new RegExp('(?:(?:^|.*;\\s*)' + escapedName + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');
}
