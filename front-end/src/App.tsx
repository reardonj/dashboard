import { Card, Classes, Divider } from "@blueprintjs/core"
import * as React from "react"
import { useModeSelector } from "use-light-switch"
import { Header } from "./components/Header";
import { CurrentConditionsReport, DailyForecasts } from "./features/weather/Components";

export const App = () => {
  const mode = useModeSelector({ dark: Classes.DARK, light: "", unset: "" });
  return (
    <div className={mode} id="layout-root">
      < Header />
      <div>
        <div className='card-grid'>
          <Card>
            <CurrentConditionsReport />
          </Card>
          <DailyForecasts />
        </div>
      </div>
      <Divider />
      <footer className={Classes.TEXT_MUTED}>
        Contains information licenced under the Data Server End-use Licence of Environment and Climate Change Canada.
      </footer>
    </div >
  )
}
