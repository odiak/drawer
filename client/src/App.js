import React from 'react';
import './App.css';
import {Link} from './components/Link';
import {Canvas} from './components/Canvas';

export const App = (props) => (
  <div className="App"
      onMouseUp={() => { props.handleOnMouseUp(); }}
      onTouchEnd={() => { props.handleOnMouseUp(); }}>
    <h1 className="App-logo">Drawer</h1>

    <ul className="App-nav">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/login">Login</Link></li>
    </ul>

    <p>{props.route.get('name')}</p>

    <div>
      <Canvas {...props} />
      <button onClick={() => { props.savePicture(props.picture.get('imageData')); }}>save</button>
      <button onClick={() => { props.clearCanvas(); }}>clear</button>
    </div>
  </div>
);
