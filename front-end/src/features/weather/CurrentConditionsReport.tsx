import { Classes, H5 } from "@blueprintjs/core";
import React from "react";
import { useAppSelector } from "../../model/Hooks"
import { CurrentConditions } from "./WeatherSlice";

export const CurrentConditionsReport = () => {
  const conditions = useAppSelector(state => state.forecast.data?.current);

  return (
    <div className="report-line">
      <H5>Current Conditions</H5>
      {renderConditions(conditions)}
    </div>
  )
}

function renderConditions(conditions: CurrentConditions | undefined) {


  if (conditions) {
    return <>
      {renderTemperature(conditions.temperature, conditions.humidex, conditions.windChill)}
      <div>{conditions.conditions}</div>
    </>
  } else {
    return <div className={Classes.SKELETON + ' full-width'} />
  }
}

function renderTemperature(temp: number, humidex: number | undefined, windChill: number | undefined) {
  const modifiedTemp = humidex || windChill;
  if (modifiedTemp) {
    return <div>
      {`${modifiedTemp.toFixed(0)}\u00b0C`} <span className={Classes.TEXT_MUTED}>{`(${temp.toFixed(0)}\u00b0C)`}</span>
    </div>
  } else {
    return <div>{`${temp.toFixed(0)}\u00b0C`}</div>
  }
}