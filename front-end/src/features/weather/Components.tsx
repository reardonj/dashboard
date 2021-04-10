import { Card, Classes, Divider, H5, H6, Text } from "@blueprintjs/core";
import { Tooltip2, Classes as ToolTipClasses } from "@blueprintjs/popover2";
import { DateTime } from "luxon";
import React from "react";
import { getSunrise, getSunset } from "sunrise-sunset-js";
import { useAppSelector } from "../../model/Hooks";
import { Forecast } from "./WeatherSlice";

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
  const elements = forecasts?.flatMap(renderForecast) ?? <div className={Classes.TEXT_MUTED}>unavailable</div>;
  return <Card>
    <H5>Forecast</H5>
    {elements}
  </Card>
}

function renderTemperature(temp: number, humidex: number | null, windChill: number | null) {
  const modifiedTemp = humidex || windChill;
  if (modifiedTemp) {
    return <div className='temperature'>
      {`${modifiedTemp.toFixed(0)}\u00b0C`} <span className={Classes.TEXT_MUTED}>{`(${temp.toFixed(0)}\u00b0C)`}</span>
    </div>
  } else {
    return <div className='temperature'>{`${temp.toFixed(0)}\u00b0C`}</div>
  }
}

function renderForecast(forecast: Forecast) {
  const report = <div className="report-line forecast">
    <div>
      <H6>{forecast.title}</H6>
      <Tooltip2 content={forecast.fullReport} position='top' className={ToolTipClasses.TOOLTIP2_INDICATOR}>
        <Text ellipsize={true}>{forecast.conditions}</Text>
      </Tooltip2>
    </div>
    <div className='spacer' />
    {renderTemperature(forecast.temperature, forecast.humidex, forecast.windChill)}
    <div className='weather-icon'><i className={'wi-fw ' + (forecast.icon || 'wi wi-na')} /></div>
  </div>

  if (forecast.title.endsWith('night')) {
    return [report, <Divider />]
  }

  return [report]
}


export default function AstronomicalReport() {
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