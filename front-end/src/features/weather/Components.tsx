import { Card, Classes, H5, H6, Text } from "@blueprintjs/core";
import { Tooltip2, Classes as ToolTipClasses } from "@blueprintjs/popover2";
import { DateTime, FixedOffsetZone } from "luxon";
import React from "react";
import { map } from "rxjs";
import { getSunrise, getSunset } from "sunrise-sunset-js";
import { AppStateProps } from "../../model/AppState";
import { useSubscription } from "../../model/Hooks";
import { Accumulation, ConditionReport, Forecast, HourlyForecast } from "./WeatherSlice";

export function CurrentConditionsReport({ appState }: AppStateProps) {
  const conditions = useSubscription(null, () => appState.weatherReport.pipe(map(x => x?.current)));

  return (
    <Card>
      <div className="report-line">
        <div>
          <H5>Current Weather
            <span className={[Classes.TEXT_MUTED, Classes.TEXT_SMALL, Classes.UI_TEXT].join(' ')}>
              {conditions
                ? <> as of {DateTime.fromSeconds(conditions.time).toLocal().toLocaleString(DateTime.TIME_24_SIMPLE)}</>
                : <> unavailable</>}
            </span>
          </H5>
          <div className='overflow-container'><Text ellipsize={true}>{conditions?.conditions}</Text></div>
          {
            conditions?.relativeHumidity
              ? <div className='overflow-container'><Text ellipsize={true}>{conditions?.relativeHumidity}% Relative Humidity</Text></div>
              : <></>
          }
        </div>
        {conditions
          ? <>
            <div className='spacer' />
            {renderTemperature(conditions.temperature, conditions.humidex, conditions.windChill)}
            <div className='weather-icon'><i className={'wi-fw ' + (conditions.icon || 'wi wi-na')} /></div>
          </>
          : <></>
        }
      </div>
      <AstronomicalReport />
    </Card>
  )
}

export function DailyForecasts({ appState }: AppStateProps) {
  const forecasts = useSubscription(null, () => appState.weatherReport.pipe(map(x => x?.forecasts)))
  const elements = forecasts?.map(renderForecast) ?? <div className={Classes.TEXT_MUTED}>unavailable</div>;
  return <Card>
    <H5>Forecast</H5>
    {forecasts ? renderTemperatureSpark(forecasts) : <></>}
    {elements}
  </Card>
}

export function HourlyForecasts({ appState }: AppStateProps) {
  const forecasts = useSubscription(null, () => appState.weatherReport.pipe(map(x => x?.hourlyForecasts)))
  return <Card>
    <H5>Hourly Forecast</H5>
    {forecasts ? renderTemperatureSpark(forecasts) : <></>}
    <div className='hourly-forecasts'>
      {forecasts
        ? <table cellSpacing={0}>
          <tbody>
            {forecasts.map(renderHourlyForecast)}
          </tbody>
        </table>
        : <div className={Classes.TEXT_MUTED}>unavailable</div>
      }
    </div>
  </Card>
}

export function Warnings({ appState }: AppStateProps) {
  const warnings = useSubscription(undefined, () => appState.weatherReport.pipe(map(x => x?.warnings)))
  if (warnings === undefined) {
    return <></>
  }

  let intent = Classes.INTENT_PRIMARY;
  if (warnings.items.find(x => x.priority === "high" || x.priority === "urgent")) {
    intent = Classes.INTENT_DANGER
  } else if (warnings.items.find(x => x.priority === "medium")) {
    intent = Classes.INTENT_WARNING
  }
  return <Card
    onClick={() => window.open(warnings.url)}
    interactive={true}
    className={[Classes.CALLOUT, intent].join(' ')}> {
      warnings?.items.map(warning => {
        const title = warning.type.length > 0 ? warning.type : 'Warning';
        return <>
          <H5>{title}</H5>
          <Text>{warning.description.length > 55 ? warning.description.slice(0, 53) + '…' : warning.description}</Text>
        </>
      })}
  </Card>
}

function renderTemperature(temp: number, humidex: number | null, windChill: number | null) {
  const modifiedTemp = humidex || windChill;
  const actual = `${temp.toFixed(0)}\u00b0C`
  if (modifiedTemp) {
    let tempDetails = <>
      Actual: {actual}<br />
      {humidex && `Humidex: ${humidex.toFixed(0)}\u00b0C`}
      {windChill && `Windchill: ${windChill.toFixed(0)}\u00b0C`}
    </>

    return <Tooltip2 content={tempDetails} position='top' className={ToolTipClasses.TOOLTIP2_INDICATOR}>
      {`${modifiedTemp.toFixed(0)}\u00b0C`}
    </Tooltip2>
  }
  return `${temp.toFixed(0)}\u00b0C`

}

function renderForecast(forecast: Forecast) {
  return <div
    className={['report-line', 'forecast', forecast.title.endsWith('night') ? 'night' : 'day'].join(' ')}
    key={forecast.title}>
    <div>
      <H6>{forecast.title}</H6>
      <Tooltip2 content={generateTooltipReport(forecast)} position='top' className={ToolTipClasses.TOOLTIP2_INDICATOR}>
        {forecast.conditions.length > 35 ? forecast.conditions.slice(0, 33) + '…' : forecast.conditions}
      </Tooltip2>
    </div>
    <div className='spacer' />
    <div className='temperature'>
      {renderTemperature(forecast.temperature, forecast.humidex, forecast.windChill)}
    </div>
    <div className='weather-icon'><i className={'wi-fw ' + (forecast.icon || 'wi wi-na')} /></div>
  </div>
}


function renderHourlyForecast(forecast: HourlyForecast) {
  const time = DateTime.fromSeconds(forecast.time, { zone: FixedOffsetZone.utcInstance }).toLocal();
  const date = time.day === DateTime.now().day ? 'today' : 'tomorrow';
  return <tr className={['report-line', 'forecast', 'hourly', date].join(' ')} key={forecast.time}>
    <td className='time-title'>
      <H6 className={warningClass(forecast)}>{to24hTime(time)}</H6>
    </td>
    <td className='temperature'>
      {renderTemperature(forecast.temperature, forecast.humidex, forecast.windChill)}
    </td>
    <td><i className={'wi-fw ' + (forecast.icon || 'wi wi-na')} /></td>
    <td>{forecast.pop > 0 ? forecast.pop.toLocaleString(undefined, { style: 'percent' }) : ''}</td>
    <td>
      {forecast.conditions.length > 20 ?
        <Tooltip2 content={forecast.conditions} position='top' className={ToolTipClasses.TOOLTIP2_INDICATOR}>
          {forecast.conditions.slice(0, 18) + '…'}
        </Tooltip2> :
        forecast.conditions}
    </td>
  </tr >
}

function AstronomicalReport() {
  const today = new Date();
  return <div className='report-line'>
    <H5>Sunrise/Sunset</H5>
    <div className='spacer' />
    <div>
      <i className={'wi wi-sunrise'} /> {to24hTime(DateTime.fromJSDate(getSunrise(45.33, -75.58, today)))}
    </div>
    <div>
      <i className={'wi wi-sunset'} /> {to24hTime(DateTime.fromJSDate(getSunset(45.33, -75.58, today)))}
    </div>
  </div>
}

function to24hTime(time: DateTime) {
  return time.toLocal().toLocaleString(DateTime.TIME_24_SIMPLE);
}

function warningClass(forecast: HourlyForecast) {
  if (forecast.pop >= 0.5) {
    return 'warning'
  }

  return ''
}
function renderTemperatureSpark(forecasts: ConditionReport[]) {
  const temps = forecasts.map(x => x.humidex || x.windChill || x.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min;
  const normalized = temps.map(x => (1 - (x - min) / range));

  const spacing = 1 / (normalized.length - 1);
  const path = normalized.reduce((text, val, idx) =>
    idx === 0
      ? `M 0 ${val} `
      //   : text + `L ${idx * spacing} ${val}`, '')
      : text + `C ${(idx - 0.5) * spacing} ${normalized[idx - 1]}, ${(idx - 0.5) * spacing} ${val}, ${idx * spacing} ${val}\n `, "")
  return <svg className="temperature-spark" viewBox="0 -0.1 1 1.2" preserveAspectRatio="none">
    <path strokeWidth='1px'
      stroke="#f99"
      vectorEffect="non-scaling-stroke"
      fill="transparent"
      d={`M 0 ${(1 - (30 - min) / range)} h 1`} />
    <path strokeWidth='1px'
      stroke="#999"
      vectorEffect="non-scaling-stroke"
      fill="transparent"
      d={`M 0 ${(1 - (0 - min) / range)} h 1`} />
    <path strokeWidth='1px'
      stroke="#99f"
      vector-effect="non-scaling-stroke"
      fill="transparent"
      d={`M 0 ${(1 - (-20 - min) / range)} h 1`} />
    <path
      strokeWidth='1px'
      stroke="#999"
      vectorEffect="non-scaling-stroke"
      fill="transparent"
      d={path} />
  </svg>
}

function generateTooltipReport(forecast: Forecast): string {
  return forecast.fullReport + precipitationReport(forecast.precipitation)
}

function precipitationReport(precipitation: Accumulation[]) {
  if (precipitation.length === 1) {
    return ` ${precipitation[0].amount}${precipitation[0].units}.`
  }
  return precipitation.map(x => ` ${x.amount}${x.units} of ${x.type}.`).join('');
}

