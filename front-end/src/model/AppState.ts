import { BehaviorSubject, concat, distinctUntilChanged, exhaustMap, map, Observable, of, partition, share, Subject } from "rxjs";
import { WeatherReport } from "../features/weather/WeatherSlice";

export type AppStateProps = { appState: AppState }

export function createAppState(fetcher: () => Observable<WeatherReport | string>): AppState {
  return new AppStateImpl(fetcher);
}

export interface AppState {
  readonly loadTrigger: Subject<void>;
  readonly loading: Observable<boolean>;
  readonly loadingError: Observable<false | { error: string }>;
  readonly weatherReport: Observable<WeatherReport | null>;
}

type FetchState = { fetchState: "started" | "finished" }
const Started: FetchState = { fetchState: "started" }
const Finished: FetchState = { fetchState: "finished" }

function isFetchState(obj: any): obj is FetchState {
  return typeof (obj) === 'object' && 'fetchState' in obj && (obj.fetchState === "started" || obj.fetchState === "finished");
}

class AppStateImpl implements AppState {

  constructor(fetcher: () => Observable<WeatherReport | string>) {
    this.loadTrigger = new Subject<void>();

    const [fetching, reports] = partition(
      this.loadTrigger.pipe(
        exhaustMap(() => concat(of(Started), fetcher(), of(Finished))),
        share()),
      isFetchState
    )

    this.loading = fetching.pipe(
      map(x => x.fetchState === "started"),
      distinctUntilChanged(),
      share({ connector: () => new BehaviorSubject(false) }))

    this.weatherReport = reports.pipe(
      map(x => typeof x === "string" ? null : x),
      share({ connector: () => new BehaviorSubject<WeatherReport | null>(null) }))

    this.loadingError = reports.pipe(
      map(x => typeof x === "string" ? { error: x } : false),
      distinctUntilChanged(),
      share({ connector: () => new BehaviorSubject<false | { error: string }>(false) }))
  }

  readonly loadTrigger: Subject<void>;
  readonly loading: Observable<boolean>;
  readonly loadingError: Observable<false | { error: string }>;
  readonly weatherReport: Observable<WeatherReport | null>;
}