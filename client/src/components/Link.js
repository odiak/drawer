import React from 'react';
import DrawerActions from '../data/DrawerActions';

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

const Link = ({pushHistory, to, children, onClick, ...props}) => {

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }

    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !props.target &&
      !isModifiedEvent(event)
    ) {
      event.preventDefault();
      DrawerActions.pushHistory(to);
    }
  };

  return <a {...props} onClick={handleClick} href={to}>{children}</a>;
};

export default Link;
