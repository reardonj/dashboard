import * as React from "react"
import ReactDOM from "react-dom"
import { App } from "./App"
import { mapTo, timer } from "rxjs"
import * as serviceWorker from "./serviceWorker"

import { loadWeather } from "./features/weather/WeatherSlice"

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { createAppState } from "./model/AppState"

const appState = createAppState(loadWeather);

timer(0, 1000 * 60 * 15).pipe(mapTo(undefined)).subscribe(appState.loadTrigger)

ReactDOM.render(
  <React.StrictMode>
    <App appState={appState} />
  </React.StrictMode>,
  document.getElementById("root"),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister()
