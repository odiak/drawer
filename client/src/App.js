import React, { Component } from 'react';
import './App.css';
import Link from './components/Link';

const App = (props) => (
  <div className="App"
      onMouseUp={() => { props.onMouseUp(); }}
      onTouchEnd={() => { props.onMouseUp(); }}>
    <h1 className="App-logo">Drawer</h1>

    <ul className="App-nav">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/login">Login</Link></li>
    </ul>

    <p>{props.route.get('name')}</p>

    <Drawer {...props} />
  </div>
);

function getOffset(node) {
  let left = 0, top = 0;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return {left, top};
}

class Drawer extends Component {
  render() {
    let imageData = this.props.picture.get('imageData');

    return (
      <div>
        <canvas
          width={imageData.width}
          height={imageData.height}
          ref={(e) => {
            if (!e) return;
            e.getContext('2d').putImageData(imageData, 0, 0);
            e.ontouchstart = (event) => {
              event.preventDefault();
              event.stopPropagation();
              let {left, top} = getOffset(event.target);
              this.props.onMouseDown(
                event.touches[0].pageX - left,
                event.touches[0].pageY - top);
            };
            e.ontouchmove = (event) => {
              event.preventDefault();
              event.stopPropagation();
              let {left, top} = getOffset(event.target);
              this.props.onMouseMove(
                event.touches[0].pageX - left,
                event.touches[0].pageY - top);
            };
          }}
          onMouseDown={(event) => {
            this.props.onMouseDown(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
          }}
          onMouseMove={(e) => {
            this.props.onMouseMove(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }}
          ></canvas>
        <button onClick={() => { this.props.clearCanvas(); }}>clear</button>
      </div>
    );
  }
}

export default App;
