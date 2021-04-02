import { Alignment, Button, Icon, Navbar } from "@blueprintjs/core";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { fetchWeather } from "../features/weather/WeatherSlice";
import { useAppDispatch, useAppSelector } from "../model/Hooks";
import { AppToasts } from "./AppToasts";

export function Header() {
  return (
    <Navbar>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading>JR's Dashboard</Navbar.Heading>
      </Navbar.Group>
      <Navbar.Group align={Alignment.RIGHT}>
        <LoadingIndicator />
        <LoadingButton />
      </Navbar.Group>
    </Navbar>
  )
}

function updateRelativeTime(update: (a: string) => void, time: number | undefined) {
  return update(time ? 'As of ' + DateTime.fromSeconds(time).toRelative() : '');
}

function LoadingIndicator() {
  const dispatcher = useAppDispatch();
  const forecastTime = useAppSelector(state => state.forecast.data?.time);
  const [relativeUpdateTime, setRelativeUpdateTime] = useState('');
  const [lastUpdate, setLastUpdate] = useState(DateTime.now().toUTC());


  useEffect(() => {
    const interval = setInterval(() => {
      updateRelativeTime(setRelativeUpdateTime, forecastTime);

      if (lastUpdate.diffNow('minutes').minutes < -15) {
        setLastUpdate(DateTime.now().toUTC());
        dispatcher(fetchWeather());
      }

    }, 1000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    updateRelativeTime(setRelativeUpdateTime, forecastTime);
  }, [setRelativeUpdateTime, forecastTime])

  return <div>{relativeUpdateTime}</div>
}


function LoadingButton() {
  const dispatcher = useAppDispatch();
  const forecastState = useAppSelector(state => state.forecast.state);

  useEffect(() => {
    if (typeof (forecastState) === 'object') {
      const message = <div>
        <b>Failed to Load Forecast</b><br />
        {forecastState.error}
      </div >
      AppToasts.show({ message, icon: 'error', intent: 'warning', })
    }
  }, [forecastState])

  let indicator;
  if (typeof (forecastState) === 'string') {
    indicator = <Icon icon='refresh' />;
  } else {
    indicator = <Icon icon='outdated' />;
  }
  return <Button
    loading={forecastState === 'fetching'}
    onClick={() => dispatcher(fetchWeather())}
    intent={typeof (forecastState) === 'string' ? 'success' : 'warning'}
  >
    {indicator}
  </Button>
}