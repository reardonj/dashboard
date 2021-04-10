import * as React from "react"
import ReactDOM from "react-dom"
import { App } from "./App"
import * as serviceWorker from "./serviceWorker"

import { store } from './model/Store'
import { Provider } from "react-redux"
import { fetchWeather } from "./features/weather/WeatherSlice"

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";


store.dispatch(fetchWeather())
setInterval(() => store.dispatch(fetchWeather()), 1000 * 60 * 60)

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister()
