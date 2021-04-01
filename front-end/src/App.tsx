import { Card, Classes, Divider, H5 } from "@blueprintjs/core"
import * as React from "react"
import { useModeSelector } from "use-light-switch"
import { Header } from "./components/Header";
import { CurrentConditionsReport } from "./features/weather/CurrentConditionsReport";

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
          <Card>
            <H5>Forecast</H5>
          </Card>
        </div>
      </div>
      <Divider />
      <footer className={Classes.TEXT_MUTED}>
        Contains information licenced under the Data Server End-use Licence of Environment and Climate Change Canada.
      </footer>
    </div >
  )
}
