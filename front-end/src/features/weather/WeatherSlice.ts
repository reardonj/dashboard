import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';
import { DateTime } from 'luxon';
import { conditionForId } from './IconMappings';

export interface ConditionReport {
  conditions: string;
  icon: string | undefined;
  temperature: number;
  windChill: number | null;
  humidex: number | null;

}

export interface CurrentConditions extends ConditionReport {
  time: number;
}

export interface Forecast extends ConditionReport {
  title: string;
}

export interface WeatherReport {
  time: number;
  current: CurrentConditions;
  forecasts: Forecast[]
}

export interface WeatherState {
  state: "fetching" | "fetched" | { error: string };
  data: WeatherReport | null;
}

class ParseError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

const initialState: WeatherState = { state: "fetched", data: null };

function getChildElement(element: Element, child: string) {
  const first = element.getElementsByTagName(child)?.[0];
  if (!first) {
    throw new ParseError(`${element.tagName} missing element ${child}`);
  }

  return first;
}

function parseChildAttribute(element: Element, child: string, attribute: string) {
  const text = element.getElementsByTagName(child)?.[0]?.getAttribute(attribute);
  if (!text) {
    throw new ParseError(`${element.tagName} missing element ${child}`);
  }

  return text;
}

function parseStringElement(element: Element, child: string): string;
function parseStringElement(element: Element, child: string, optional?: boolean): string | null;
function parseStringElement(element: Element, child: string, optional?: boolean) {
  const text = element.getElementsByTagName(child)?.[0]?.textContent;
  if (!text && !optional) {
    throw new ParseError(`${element.tagName} missing element ${child}`);
  }

  return text;
}

function parseNumberElement(element: Element, child: string): number;
function parseNumberElement(element: Element, child: string, optional: boolean): number | null;
function parseNumberElement(element: Element, child: string, optional?: boolean) {
  const text = parseStringElement(element, child, optional);
  if (!text && optional) {
    return null;
  }

  const number = Number(text);
  if (isNaN(number)) {
    throw new ParseError(`${element.tagName} with element ${child} does not contain a number`);
  }

  return number;
}

function parseDate(dateTime: Element): DateTime {
  return DateTime.utc(
    parseNumberElement(dateTime, 'year'),
    parseNumberElement(dateTime, 'month'),
    parseNumberElement(dateTime, 'day'),
    parseNumberElement(dateTime, 'hour'),
    parseNumberElement(dateTime, 'minute'));
}

function parseForecast(forecast: Element): Forecast {
  const abbreviated = getChildElement(forecast, 'abbreviatedForecast');
  return {
    title: parseChildAttribute(forecast, 'period', 'textForecastName'),
    icon: conditionForId(parseNumberElement(abbreviated, 'iconCode')),
    conditions: parseStringElement(abbreviated, 'textSummary'),
    temperature: parseNumberElement(getChildElement(forecast, 'temperatures'), 'temperature'),
    windChill: null,
    humidex: null
  }
}

function parseCurrentConditions(current: Element): CurrentConditions {
  var dateElement = Array.from(current.getElementsByTagName('dateTime')).find(x => x.getAttribute('zone') === 'UTC');
  if (!dateElement) {
    throw new ParseError("currentConditions missing UTC dateTime");
  }

  return {
    time: parseDate(dateElement).toSeconds(),
    conditions: parseStringElement(current, 'condition'),
    temperature: parseNumberElement(current, 'temperature'),
    icon: conditionForId(parseNumberElement(current, 'iconCode')),
    windChill: parseNumberElement(current, 'windChill', true),
    humidex: parseNumberElement(current, 'humidex', true)
  };
}

function parseForecastGroup(forecasts: Element): Forecast[] {
  return Array.from(forecasts.getElementsByTagName('forecast')).map(parseForecast);
}

function parseWeather(xml: Document): WeatherReport {
  const reportTimeNodes = xml.evaluate(
    "/siteData/dateTime[@name='xmlCreation' and @zone='UTC']",
    xml,
    undefined,
    XPathResult.FIRST_ORDERED_NODE_TYPE);
  if (!(reportTimeNodes.singleNodeValue instanceof Element)) {
    throw new ParseError("Missing creation time");
  }
  return {
    time: parseDate(reportTimeNodes.singleNodeValue).toSeconds(),
    current: parseCurrentConditions(xml.getElementsByTagName('currentConditions')[0]),
    forecasts: parseForecastGroup(xml.getElementsByTagName('forecastGroup')[0])
  }
}

// Thunk functions
export const fetchWeather = createAsyncThunk('weather/fetchWeather', async () => {
  const response = await axios('/api/weather/citypage_weather/xml/ON/s0000430_e.xml');
  const xml = new DOMParser().parseFromString(response.data, "text/xml");
  try {
    return parseWeather(xml);
  }
  catch (e) {
    if (e instanceof ParseError) {
      return e.message;
    }

    throw (e);
  }
});

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    loadWeather(state, action) {
      return {
        ...state,
        isFetching: true
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeather.pending, (state, action) => {
        state.state = "fetching";
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.state = "fetched";

        if (typeof (action.payload) === "string") {
          state.state = { error: action.payload };
        } else {
          state.state = "fetched";
          state.data = action.payload;
        }
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.state = { error: action.error.message || "Unexpected error" };
      })
  }
})

export const { loadWeather } = weatherSlice.actions

export default weatherSlice