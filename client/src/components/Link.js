import React from 'react';
import {history} from '../history';

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export const Link = ({pushHistory, to, children, onClick, ...props}) => {
  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }

    if (!event.defaultPrevented && event.button === 0 && !props.target && !isModifiedEvent(event)) {
      event.preventDefault();
      history.push(to);
    }
  };

  return (
    <a {...props} onClick={handleClick} href={to}>
      {children}
    </a>
  );
};
