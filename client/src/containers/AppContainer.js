import App from '../App';
import {Container} from 'flux/utils';
import DrawerActions from '../data/DrawerActions';
import PictureStore from '../data/PictureStore';
import RouteStore from '../data/RouteStore';

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
