import App from '../App';
import {Container} from 'flux/utils';
import DrawerActions from '../data/DrawerActions';
import PictureStore from '../data/PictureStore';

function getStores() {
  return [
    PictureStore,
  ];
}

function getState() {
  return {
    picture: PictureStore.getState(),

    onMouseDown: DrawerActions.handleOnMouseDown,
    onMouseMove: DrawerActions.handleOnMouseMove,
    onMouseUp: DrawerActions.handleOnMouseUp,
    clearCanvas: DrawerActions.clearCanvas,
  };
}

export default Container.createFunctional(App, getStores, getState);
