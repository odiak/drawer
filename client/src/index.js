import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {AppContainer} from './containers/AppContainer';
import registerServiceWorker from './registerServiceWorker';
import {history} from './history';
import {DrawerActions} from './data/DrawerActions';

DrawerActions.pushHistory(history.location.pathname);

history.listen((location, action) => {
  DrawerActions.pushHistory(location.pathname);
});

ReactDOM.render(<AppContainer/>, document.getElementById('root'));
registerServiceWorker();
