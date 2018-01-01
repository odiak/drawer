import * as React from 'react';

const colors = [
  [0, 0, 0, 255],
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [100, 100, 100, 255],
  [255, 255, 255, 255],
];

function colorToString([r, g, b, a]) {
  return `rgba(${r},${g},${b},${a / 255})`;
}

function sameColor(c1, c2) {
  const [r1, g1, b1, a1] = c1;
  const [r2, g2, b2, a2] = c2;
  return (r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2) || (a1 === a2 && a1 === 0);
}

export function ColorSelector(props) {
  const elements = colors.map((color) => {
    const s = colorToString(color);
    return (
      <span
        key={s}
        style={{
          display: 'inline-block',
          width: '30px',
          height: '30px',
          backgroundColor: s,
          marginRight: '5px',
          border: '1px solid' + (sameColor(props.picture.currentColor, color) ? '#222' : '#999'),
        }}
        onClick={(event) => props.changeColor(color)}
      />
    );
  });
  return <p>{elements}</p>;
}
