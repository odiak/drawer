import App from '../App';
import React, {Component} from 'react';
import {Container} from 'flux/utils';
import PropTypes from 'prop-types';
import DrawerActions from '../data/DrawerActions';
import PictureStore from '../data/PictureStore';
import RouteStore from '../data/RouteStore';
import history from '../history';

export default Container.createFunctional(
  App,
  () => ([
    PictureStore,
    RouteStore,
  ]),
  () => ({
    picture: PictureStore.getState(),
    route: RouteStore.getState(),

    pushHistory: DrawerActions.pushHistory,
    onMouseDown: DrawerActions.handleOnMouseDown,
    onMouseMove: DrawerActions.handleOnMouseMove,
    onMouseUp: DrawerActions.handleOnMouseUp,
    clearCanvas: DrawerActions.clearCanvas,
  })
);
