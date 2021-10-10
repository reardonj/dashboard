import { catchError, from, map, Observable, of } from 'rxjs';
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

export interface Accumulation {
  type: string;
  amount: number;
  units: string;
}

export interface CurrentConditions extends ConditionReport {
  relativeHumidity: number | null;
  time: number;
}

export interface HourlyForecast extends ConditionReport {
  time: number;
  pop: number;
}

export interface Forecast extends ConditionReport {
  title: string;
  fullReport: string;
  precipitation: Accumulation[]
}

export type WarningPriority = 'urgent' | 'high' | 'medium' | 'low'
export interface Warning {
  type: string;
  description: string;
  priority: WarningPriority;
}

export interface WeatherReport {
  time: number;
  current: CurrentConditions;
  forecasts: Forecast[];
  hourlyForecasts: HourlyForecast[];
  warnings: { url: string, items: Warning[] } | undefined
}

export interface WeatherState {
  state: 'fetching' | 'fetched' | { error: string };
  data: WeatherReport | null;
}

class ParseError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

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
    humidex: parseNumberElement(getChild(forecast, ['humidex', 'calculated'], true), true),
    precipitation: parsePrecipitation(getChild(forecast, 'precipitation', true))
  }
}

function parsePrecipitation(precipitationSection: Element | null): Accumulation[] {
  if (!precipitationSection) {
    return [];
  }
  return Array.from(precipitationSection.getElementsByTagName('accumulation')).map(acc => {
    var amountElement = getChild(acc, 'amount');
    return {
      type: getChild(acc, 'name').textContent || 'unknown precipitation',
      amount: parseNumberElement(amountElement),
      units: parseAttribute(amountElement, 'units')
    }
  });
}

function parseCurrentConditions(current: Element): CurrentConditions {
  var dateElement = Array.from(current.getElementsByTagName('dateTime')).find(x => x.getAttribute('zone') === 'UTC');
  if (!dateElement) {
    throw new ParseError('currentConditions missing UTC dateTime');
  }

  return {
    time: parseDate(dateElement).toSeconds(),
    conditions: parseStringElement(getChild(current, 'condition')),
    temperature: parseNumberElement(getChild(current, 'temperature')),
    icon: conditionForId(parseNumberElement(getChild(current, 'iconCode'))),
    windChill: parseNumberElement(getChild(current, 'windChill', true), true),
    humidex: parseNumberElement(getChild(current, 'humidex', true), true),
    relativeHumidity: parseNumberElement(getChild(current, 'relativeHumidity', true), true)
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

function parsePriority(priority: string): WarningPriority {
  switch (priority) {
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
      return 'high'
    case 'urgent':
      return 'urgent'
    default:
      return 'medium'
  }
}

function parseWarnings(warningSection: Element) {
  const url = warningSection.getAttribute('url');
  if (url === null) {
    return undefined;
  }

  return {
    url: url ?? '',
    items: Array.from(warningSection.getElementsByTagName('event')).map(x => {
      return {
        description: parseAttribute(x, 'description'),
        type: parseAttribute(x, 'type'),
        priority: parsePriority(parseAttribute(x, 'priority'))
      }
    })
  }
}

function parseWeather(xml: Document): WeatherReport {
  const reportTimeNodes = xml.evaluate(
    '/siteData/dateTime[@name="xmlCreation" and @zone="UTC"]',
    xml,
    undefined,
    XPathResult.FIRST_ORDERED_NODE_TYPE);
  if (!(reportTimeNodes.singleNodeValue instanceof Element)) {
    throw new ParseError('Missing creation time');
  }
  return {
    time: parseDate(reportTimeNodes.singleNodeValue).toSeconds(),
    current: parseCurrentConditions(xml.getElementsByTagName('currentConditions')[0]),
    forecasts: parseForecastGroup(xml.getElementsByTagName('forecastGroup')[0]),
    hourlyForecasts: parseHourlyForecastGroup(xml.getElementsByTagName('hourlyForecastGroup')[0]),
    warnings: parseWarnings(xml.getElementsByTagName('warnings')[0])
  }
}

export function loadWeather(): Observable<WeatherReport | string> {
  return from(axios(
    process.env.NODE_ENV === 'production'
      ? 'https://dashboard-proxy.jmreardon.com/api/weather/citypage_weather/xml/ON/s0000430_e.xml'
      : '/api/weather/citypage_weather/xml/ON/s0000430_e.xml'))
    .pipe(
      map(response => parseWeather(new DOMParser().parseFromString(response.data, 'text/xml'))),
      catchError((err, caught) => of(handleParseErrors(err)))
    )
}

function handleParseErrors(err: any) {
  if (err instanceof ParseError) {
    return err.message;
  }

  return "unexpected error: " + err;
}
