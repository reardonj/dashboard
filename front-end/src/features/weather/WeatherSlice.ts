import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';
import { DateTime, FixedOffsetZone } from 'luxon';
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

export interface HourlyForecast extends ConditionReport {
  time: number;
  pop: number;
}

export interface Forecast extends ConditionReport {
  title: string;
  fullReport: string
}

export interface WeatherReport {
  time: number;
  current: CurrentConditions;
  forecasts: Forecast[]
  hourlyForecasts: HourlyForecast[]
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

function getChild(element: Element, child: string | string[]): Element;
function getChild(element: Element, child: string | string[], optional?: boolean): Element | null;
function getChild(element: Element, child: string | string[], optional?: boolean) {
  let curr: string;
  let rest: string[]
  if (typeof (child) === 'string') {
    curr = child;
    rest = [];
  } else if (child.length === 0) {
    return element;
  } else {
    curr = child[0];
    rest = child.slice(1);
  }

  const first = element.getElementsByTagName(curr)?.[0];
  if (!first && !optional) {
    throw new ParseError(`${element.tagName} missing element ${child}`);
  }

  if (rest.length > 0) {
    return getChild(first, rest, optional);
  } else {
    return first;
  }
}

function parseAttribute(element: Element, attribute: string) {
  const text = element.getAttribute(attribute);
  if (!text) {
    throw new ParseError(`${element.tagName} missing attribute ${attribute}`);
  }

  return text;
}

function parseStringElement(element: Element): string;
function parseStringElement(element: Element | null, optional?: boolean): string | null;
function parseStringElement(element: Element | null, optional?: boolean) {
  const text = element?.textContent;
  if (!text && !optional) {
    throw new ParseError('Element or content was missing');
  }

  return text;
}

function parseNumberElement(element: Element): number;
function parseNumberElement(element: Element | null, optional: boolean): number | null;
function parseNumberElement(element: Element | null, optional?: boolean) {
  const text = parseStringElement(element, optional);
  if (!text && optional) {
    return null;
  }

  const number = Number(text);
  if (isNaN(number)) {
    throw new ParseError(`${element!.tagName} does not contain a number`);
  }

  return number;
}

function parseDate(dateTime: Element): DateTime {
  return DateTime.utc(
    parseNumberElement(getChild(dateTime, 'year')),
    parseNumberElement(getChild(dateTime, 'month')),
    parseNumberElement(getChild(dateTime, 'day')),
    parseNumberElement(getChild(dateTime, 'hour')),
    parseNumberElement(getChild(dateTime, 'minute')));
}

function parseForecast(forecast: Element) {
  const abbreviated = getChild(forecast, 'abbreviatedForecast');
  return {
    title: parseAttribute(getChild(forecast, 'period'), 'textForecastName'),
    icon: conditionForId(parseNumberElement(getChild(abbreviated, 'iconCode'))),
    fullReport: parseStringElement(getChild(forecast, 'textSummary')),
    conditions: parseStringElement(getChild(abbreviated, 'textSummary')),
    temperature: parseNumberElement(getChild(forecast, ['temperatures', 'temperature'])),
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
    conditions: parseStringElement(getChild(current, 'condition')),
    temperature: parseNumberElement(getChild(current, 'temperature')),
    icon: conditionForId(parseNumberElement(getChild(current, 'iconCode'))),
    windChill: parseNumberElement(getChild(current, 'windChill', true), true),
    humidex: parseNumberElement(getChild(current, 'humidex', true), true)
  };
}

function parseForecastGroup(forecasts: Element): Forecast[] {
  return Array.from(forecasts.getElementsByTagName('forecast')).map(parseForecast);
}

function parseHourlyForecastGroup(forecasts: Element): HourlyForecast[] {
  return Array.from(forecasts.getElementsByTagName('hourlyForecast')).map(current => {
    const dateString = parseAttribute(current, 'dateTimeUTC');
    const date = DateTime.fromFormat(dateString, 'yyyyMMddHHmm', { zone: FixedOffsetZone.utcInstance });
    return {
      time: date.toSeconds(),
      conditions: parseStringElement(getChild(current, 'condition')),
      temperature: parseNumberElement(getChild(current, 'temperature')),
      icon: conditionForId(parseNumberElement(getChild(current, 'iconCode'))),
      windChill: parseNumberElement(getChild(current, 'windChill', true), true),
      humidex: parseNumberElement(getChild(current, 'humidex', true), true),
      pop: (parseNumberElement(getChild(current, 'lop', true), true) || 0) / 100
    };
  });
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
    forecasts: parseForecastGroup(xml.getElementsByTagName('forecastGroup')[0]),
    hourlyForecasts: parseHourlyForecastGroup(xml.getElementsByTagName('hourlyForecastGroup')[0])
  }
}

// Thunk functions
export const fetchWeather = createAsyncThunk('weather/fetchWeather', async () => {
  const response = await axios('https://dashboard-proxy.jmreardon.com/api/weather/citypage_weather/xml/ON/s0000430_e.xml');
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