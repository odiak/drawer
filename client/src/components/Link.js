import React from 'react';
import PropTypes from 'prop-types';

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export default class Link extends React.Component {
  static contextTypes = {
    history: PropTypes.object,
  };

  handleClick = (event) => {
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    const history = this.context.history;
    const {to} = this.props;

    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !this.props.target &&
      !isModifiedEvent(event)
    ) {
      event.preventDefault();
      history.push(to);
    }
  };

  render() {
    const {to, children, ...props} = this.props;

    return <a {...props} onClick={this.handleClick} href={to}>{children}</a>;
  }
}
