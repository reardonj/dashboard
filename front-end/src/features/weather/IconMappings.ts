const idToCondition: Record<number, string> = {
  0: 'wi-day-sunny', // sunny
  1: 'wi-day-sunny-overcast', // mainly sunny
  2: 'wi-day-cloudy', // partly cloudy
  3: 'wi-day-cloudy-high', // mostly cloudy
  4: 'wi-day-cloudy-high', // increasingly cloudy
  6: 'wi-day-showers', // light rain shower
  7: 'wi-day-rain-mix', // light rain shower and flurries
  8: 'wi-day-snow', // light flurries
  9: 'wi-day-storm-showers', // thunder showers
  10: 'wi-cloudy', // cloudy
  11: 'wi-rain', // precipitation
  12: 'wi-showers', // rain showers
  13: 'wi-rain', // rain
  14: 'wi-sleet', // freezing rain
  15: 'wi-rain-mix', // snow & rain
  16: 'wi-snow', // light snow
  17: 'wi-snow', // snow
  18: 'wi-snow', // heavy snow
  19: 'wi-thunderstorm', // thunderstorms
  23: 'wi-dust', // haze
  24: 'wi-fog', // fog
  25: 'wi-snow-wind', // drifting snow
  26: 'wi-hail', // ice crystals
  27: 'wi-hail', // hail
  28: 'wi-sprinkle', // drizzle
  30: 'wi-night-clear', // clear (night)
  31: 'wi-night-alt-partly-cloudy', // mostly clear
  32: 'wi-night-alt-cloudy', // cloudy
  33: 'wi-night-alt-cloudy-high', // mostly cloudy
  34: 'wi-night-alt-cloudy-high', // increasingly cloudy
  36: 'wi-night-alt-showers', // rain showers
  37: 'wi-night-alt-rain-mix', // rain-snow mix
  38: 'wi-night-alt-snow', // light flurries
  39: 'wi-night-alt-thunderstorm', // thunderstorm
  40: 'wi-night-alt-snow-wind', // blowing snow
  41: 'wi-tornado', // funnel cloud
  42: 'wi-tornado', // tornado
  43: 'wi-strong-wind', // windy
  44: 'wi-smoke', // smoke
  45: 'wi-dust', // dust
  46: 'wi-hail', // thunderstorm with hail
  47: 'wi-thunderstorm', // thunderstorm with dust
  48: 'wi-tornado' // waterspout
}

export function conditionForId(id: number): string | undefined {
  if (id in idToCondition) {
    return 'wi ' + idToCondition[id];
  }

  return undefined;
}