import { Classes, Divider } from "@blueprintjs/core"
import * as React from "react"
import { useModeSelector } from "use-light-switch"
import { Header } from "./components/Header";
import { CurrentConditionsReport, DailyForecasts, HourlyForecasts, Warnings } from "./features/weather/Components";

import './App.scss';
import { AppStateProps } from "./model/AppState";

export const App = ({ appState }: AppStateProps) => {
  const mode = useModeSelector({ dark: Classes.DARK, light: "", unset: "" });

  return (
    <div className={mode} id="layout-root">
      < Header appState={appState} />
      <div>
        <div className='card-grid'>
          <CurrentConditionsReport appState={appState} />
          <Warnings appState={appState} />
          <HourlyForecasts appState={appState} />
          <DailyForecasts appState={appState} />
        </div>
      </div>
      <Divider />
      <footer className={Classes.TEXT_MUTED}>
        Contains information licenced under the Data Server End-use Licence of Environment and Climate Change Canada.
      </footer>
    </div >
  )
}
