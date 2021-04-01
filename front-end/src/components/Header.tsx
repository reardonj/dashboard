import { Alignment, Button, Icon, Navbar } from "@blueprintjs/core";
import React from "react";
import { fetchWeather } from "../features/weather/WeatherSlice";
import { useAppDispatch, useAppSelector } from "../model/Hooks";

export function Header() {
  return (
    <Navbar>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading>JR's Dashboard</Navbar.Heading>
      </Navbar.Group>
      <LoadingIndicator />
    </Navbar>
  )
}

function LoadingIndicator() {
  const dispatcher = useAppDispatch()
  const isFetching = useAppSelector(state => state.forecast.state);
  let indicator;
  if (typeof (isFetching) === 'string') {
    indicator = <Icon icon='refresh' />;
  } else {
    indicator = <Icon icon='outdated' />
  }
  return (
    <Navbar.Group align={Alignment.RIGHT}>
      <Button
        loading={isFetching === 'fetching'}
        onClick={() => dispatcher(fetchWeather())}
        intent={typeof (isFetching) === 'string' ? 'success' : 'warning'}
      >
        {indicator}
      </Button>
    </Navbar.Group>
  )
}