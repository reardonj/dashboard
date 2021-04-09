import { Card, Classes, Divider, H5, H6, Text } from "@blueprintjs/core";
import { DateTime } from "luxon";
import React from "react";
import { useAppSelector } from "../../model/Hooks"
import { ConditionReport, Forecast } from "./WeatherSlice";

export function CurrentConditionsReport() {
  const conditions = useAppSelector(state => state.forecast.data?.current);

  return (
    <div className="report-line">
      <div>
        <H5>Current Weather</H5>
        <div className={Classes.TEXT_MUTED}>
          {conditions
            ? <>as of {DateTime.fromSeconds(conditions.time).toLocal().toLocaleString(DateTime.TIME_24_SIMPLE)}</>
            : <>unavailable</>}
        </div>
      </div>
      {renderConditions(conditions)}
    </div>
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

function renderConditions(conditions: ConditionReport | undefined) {
  if (conditions) {
    return <>
      <div className='spacer' />
      <div className='overflow-container'><Text ellipsize={true}>{conditions.conditions}</Text></div>
      {renderTemperature(conditions.temperature, conditions.humidex, conditions.windChill)}
      <div className='weather-icon'><i className={'wi-fw ' + (conditions.icon || 'wi wi-na')} /></div>
    </>
  } else {
    return <></>
  }
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
      <Text ellipsize={true}>{forecast.conditions}</Text>
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
