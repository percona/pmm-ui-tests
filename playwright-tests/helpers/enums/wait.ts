const oneSecond = 1000;
const oneMin = 60 * oneSecond;

/**
 * Global waits values collection to remove magic numbers
 * and to adjust tests waits in a single place
 */
enum Wait {
  OneSecond = oneSecond,
  TwoSeconds = 2 * oneSecond,
  TenSeconds = 10 * oneSecond,
  OneMinute = 60 * oneSecond,
  TwoMinutes = 2 * oneMin,
  ThreeMinutes = 3 * oneMin,
  FiveMinutes = 5 * oneMin,
  TenMinutes = 10 * oneMin,
  TwentyMinutes = 20 * oneMin,
  ToastMessage = 30 * oneSecond,
}

export default Wait;
