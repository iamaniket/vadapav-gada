import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import isMobile from 'is-mobile';

ReactDOM.render(
  <>
    <div id="loader-holder" className="loader-holder">
      <div className="background" />
      <img className="vadapaav-thumb" src="./vadapaav.png" alt="Girl in a jacket" style={{ width: isMobile() ? "80%" : "22%" }} />
      <div className="loader" />
    </div>
    <App />
  </>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
