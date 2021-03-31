import { Alignment, Card, Classes, Divider, H1, H2, H5, Navbar } from "@blueprintjs/core"
import * as React from "react"
import { useModeSelector } from "use-light-switch"
import { CurrentConditionsReport } from "./features/weather/CurrentConditionsReport";

export const App = () => {
  const mode = useModeSelector({ dark: Classes.DARK, light: "", unset: "" });
  return (
    <div className={mode} id="layout-root">
      <Navbar>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>JR's Dashboard</Navbar.Heading>
        </Navbar.Group>
      </Navbar>
      <Card>
        <CurrentConditionsReport />
      </Card>
      <Card>
        <H5>Forecast</H5>
      </Card>
      <Divider />
      <footer className={Classes.TEXT_MUTED}>
        Contains information licenced under the Data Server End-use Licence of Environment and Climate Change Canada.
      </footer>
    </div >
  )
}
