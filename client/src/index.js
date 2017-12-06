import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AppContainer from './containers/AppContainer';
import registerServiceWorker from './registerServiceWorker';
import history from './history';
import DrawerActions from './data/DrawerActions';

console.log(history);
DrawerActions.pushHistory(history.location.pathname);

ReactDOM.render(<AppContainer/>, document.getElementById('root'));
registerServiceWorker();
