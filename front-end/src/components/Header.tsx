import { Alignment, Button, Icon, Navbar } from "@blueprintjs/core";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { BehaviorSubject, combineLatest, concat, concatMap, delay, from, map, share, shareReplay } from "rxjs";
import { AppStateProps } from "../model/AppState";
import { useSubscription } from "../model/Hooks";
import { AppToasts } from "./AppToasts";

export function Header({ appState }: AppStateProps) {
  return (
    <Navbar>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading>JR's Dashboard</Navbar.Heading>
      </Navbar.Group>
      <Navbar.Group align={Alignment.RIGHT}>
        <LastUpdate appState={appState} />
        <LoadingButton appState={appState} />
      </Navbar.Group>
    </Navbar>
  )
}

function updateRelativeTime(time: number | undefined): string {
  return time ? 'As of ' + DateTime.fromSeconds(time).toRelative() : '';
}

function LastUpdate({ appState }: AppStateProps) {
  const lastUpdateText = useSubscription('', () => {
    const weatherReportTime = appState.weatherReport.pipe(map(report => report?.time), shareReplay(1));
    const updateTrigger = new BehaviorSubject(0);
    const periodicUpdate = combineLatest([updateTrigger, weatherReportTime])
      .pipe(concatMap(([_, time]) => lastUpdateDelay(time)), share());
    periodicUpdate.subscribe(updateTrigger);
    //const periodicUpdate = weatherReportTime.pipe(concatMap(time => lastUpdateDelay(time)), repeat())
    //const periodicUpdate = from(timeToTimeout(undefined)).pipe(repeat());
    return combineLatest([concat(from([0]), periodicUpdate), weatherReportTime])
      .pipe(map(([_, forecastTime]) => updateRelativeTime(forecastTime)))
  });

  return <div>{lastUpdateText}</div>
}


function LoadingButton({ appState }: AppStateProps) {
  const isFetching = useSubscription(false, () => appState.loading);
  const loadingError = useSubscription(false, () => appState.loadingError);

  useEffect(() => {
    if (loadingError) {
      const message = <div>
        <b>Failed to Load Forecast</b><br />
        {loadingError.error}
      </div >
      AppToasts.show({ message, icon: 'error', intent: 'warning', })
    }
  }, [loadingError])

  return <Button
    loading={isFetching}
    onClick={() => appState.loadTrigger.next()}
    intent={loadingError ? 'warning' : 'success'}
  >
    <Icon icon={loadingError ? 'outdated' : 'refresh'} />
  </Button>
}

function lastUpdateDelay(time: number | undefined) {
  if (time) {
    let delayTime;
    const timeDiff = DateTime.fromSeconds(time).diffNow('minutes').minutes
    if (timeDiff > -1) {
      delayTime = 1000;
    } else {
      delayTime = 1000 * 60;
    }
    return from([0]).pipe(delay(delayTime))
  }

  return from([0]).pipe(delay(1000))
}
