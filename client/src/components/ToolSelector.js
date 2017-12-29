import * as React from 'react';

const menuItems = [['pen', 'pen'], ['fill', 'fill']];

export const ToolSelector = (props) => {
  const options = menuItems.map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));

  return (
    <p>
      <select
        onChange={(event) => props.changeTool(event.target.value)}
        value={props.picture.currentTool}
      >
        {options}
      </select>
    </p>
  );
};
