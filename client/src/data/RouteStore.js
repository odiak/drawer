import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import {DrawerActionTypes} from './DrawerActionTypes';

const routeDefinition = [
  {name: 'home', pattern: '/'},
  {name: 'login', pattern: '/login'},
  {name: 'pictureDetail', pattern: '/p/:pictureId'},
];

for (let route of routeDefinition) {
  let {pattern} = route;
  if (typeof pattern === 'string' && /:\w+/.test(pattern)) {
    route.args = [];
    route.pattern = pattern.replace(/:(\w+)/g, (s, name) => {
      route.args.push(name);
      return '([^/]+)';
    });
  }
}

function route(path) {
  let queryString, hash;
  [path, queryString] = path.split('?', 2);
  queryString || (queryString = '');
  [queryString, hash] = queryString.split('#', 2);
  hash || (hash = '');

  let query = queryString ? queryString.split('&').reduce((s, o) => {
    let [k, v] = s.split('=', 2);
    v || (v = true);
    o[k] = v;
    return o;
  }, {}) : {};

  // remove trailing slash
  if (path !== '/' && path.charAt(path.length - 1) === '/') {
    path = path.slice(0, path.length - 2);
  }

  let routeName = 'unknown';
  let params = {};
  for (let {name, pattern, args} of routeDefinition) {
    if (typeof pattern === 'string') {
      if (path === pattern) {
        routeName = name;
        break;
      }
    } else if (pattern instanceof RegExp) {
      let m = pattern.exec(path);
      if (m) {
        args || (args = []);
        routeName = name;
        break;
      }
    }
  }

  return Immutable.Map({
    name: routeName,
    params,
    query,
    queryString,
    hash,
  });
}

export class RouteStore extends ReduceStore {
  getInitialState() {
    return Immutable.Map({
      name: null,
      query: Immutable.Map({}),
      queryString: '',
      hash: '',
    });
  }

  reduce(state, action) {
    switch (action.type) {
      case DrawerActionTypes.PUSH_HISTORY:
        console.log(action);
        return route(action.path);
      default:
        return state;
    }
  }
}
