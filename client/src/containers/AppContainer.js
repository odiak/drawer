import {App} from '../App';
import {Container} from 'flux/utils';
import {DrawerActions} from '../data/DrawerActions';
import {PictureStore} from '../data/PictureStore';
import {RouteStore} from '../data/RouteStore';
import {DrawerDispatcher} from '../data/DrawerDispatcher';

const pictureStore = new PictureStore(DrawerDispatcher);
const routeStore = new RouteStore(DrawerDispatcher);

export const AppContainer = Container.createFunctional(
  App,
  () => ([
    pictureStore,
    routeStore,
  ]),
  () => ({
    picture: pictureStore.getState(),
    route: routeStore.getState(),

    ...DrawerActions,
  })
);
