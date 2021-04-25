import { Card, Classes, H5, H6, Text } from "@blueprintjs/core";
import { Tooltip2, Classes as ToolTipClasses } from "@blueprintjs/popover2";
import { DateTime, FixedOffsetZone } from "luxon";
import React from "react";
import { getSunrise, getSunset } from "sunrise-sunset-js";
import { useAppSelector } from "../../model/Hooks";
import { Forecast, HourlyForecast } from "./WeatherSlice";

export function CurrentConditionsReport() {
  const conditions = useAppSelector(state => state.forecast.data?.current);

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

export function DailyForecasts() {
  const forecasts = useAppSelector(state => state.forecast.data?.forecasts);
  const elements = forecasts?.map(renderForecast) ?? <div className={Classes.TEXT_MUTED}>unavailable</div>;
  return <Card>
    <H5>Forecast</H5>
    {elements}
  </Card>
}

export function HourlyForecasts() {
  const forecasts = useAppSelector(state => state.forecast.data?.hourlyForecasts);
  return <Card>
    <H5>Hourly Forecast</H5>
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
      <Tooltip2 content={forecast.fullReport} position='top' className={ToolTipClasses.TOOLTIP2_INDICATOR}>
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
    <td className='temperature'>{`${(forecast.humidex || forecast.windChill || forecast.temperature).toFixed(0)}\u00b0C`}
      {(forecast.humidex || forecast.windChill)
        ? <span className='temperature'>{`${forecast.temperature.toFixed(0)}\u00b0C`}</span>
        : <></>
      }
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
