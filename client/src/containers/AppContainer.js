import App from '../App';
import React, {Component} from 'react';
import {Container} from 'flux/utils';
import PropTypes from 'prop-types';
import DrawerActions from '../data/DrawerActions';
import PictureStore from '../data/PictureStore';
import history from '../history';

function getStores() {
}

function getState() {
}

class AppContainer extends Component {
  static getStores() {
    return [
      PictureStore,
    ];
  }

  static calculateState() {
    return {
      picture: PictureStore.getState(),

      onMouseDown: DrawerActions.handleOnMouseDown,
      onMouseMove: DrawerActions.handleOnMouseMove,
      onMouseUp: DrawerActions.handleOnMouseUp,
      clearCanvas: DrawerActions.clearCanvas,
    };
  }

  static childContextTypes = {
    history: PropTypes.object.isRequired,
  };

  getChildContext() {
    return {
      history,
    };
  }

  render() {
    return <App {...this.state}/>
  }
}

export default Container.create(AppContainer);
