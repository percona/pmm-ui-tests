const oneSecond = 1000;
const oneMin = 60 * oneSecond;

enum Duration {
  OneSecond = oneSecond,
  OneMinute = oneMin,
  ThreeMinutes = 3 * oneMin,
  FiveMinutes = 5 * oneMin,
  TenMinutes = 10 * oneMin,
  TwentyMinutes = 20 * oneMin,
}

export default Duration;
