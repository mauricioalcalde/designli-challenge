# Delta for stocks

## ADDED Requirements

### Requirement: Mobile StocksRepository Chart Method

The mobile `StocksRepository` abstract port **MUST** expose a `getChart(symbol: string, timeframe: string): Promise<StockChartPoint[]>` method. The data layer implementation **MUST** call `GET /stocks/:symbol/chart?range={timeframe}`.

#### Scenario: Chart method resolves with data

- **GIVEN** a mock `StocksRepository` implementing `getChart`
- **WHEN** `getChart("AAPL", "1W")` is called
- **THEN** it returns an array of `StockChartPoint` objects with `{ timestamp, open, high, low, close }`

#### Scenario: Chart method handles HTTP 404

- **GIVEN** the API returns 404 for an unknown symbol
- **WHEN** `getChart("UNKNOWN", "1W")` is called
- **THEN** the method **MUST** throw a domain error (e.g., `StocksLoadError`)
- **AND** the error message indicates the symbol was not found

### Requirement: Chart State in Zustand Store

The mobile stocks store **MUST** include chart state: `chartPoints`, `chartIsLoading`, `chartError`, and a `loadChart(symbol, timeframe)` action. The existing `load`/`refresh` actions **MUST** remain unchanged.

#### Scenario: Load chart data into store

- **GIVEN** a Zustand store with a mock repository returning 3 chart points
- **WHEN** `loadChart("AAPL", "1W")` is dispatched
- **THEN** `chartIsLoading` transitions `true → false`
- **AND** `chartPoints` contains the 3 mock points
- **AND** `chartError` is `null`

#### Scenario: Chart load failure sets error

- **GIVEN** the repository's `getChart` rejects with a network error
- **WHEN** `loadChart("AAPL", "1W")` is dispatched
- **THEN** `chartIsLoading` transitions `true → false`
- **AND** `chartError` contains the error message
- **AND** `chartPoints` remains an empty array

#### Scenario: Rapid timeframe changes discard stale responses

- **GIVEN** `loadChart("AAPL", "1W")` is in-flight
- **WHEN** `loadChart("AAPL", "1M")` is dispatched before the first resolves
- **THEN** only the `1M` data populates `chartPoints`
- **AND** the stale `1W` response is discarded

### Requirement: StockChartScreen Navigation

The Stocks tab **MUST** use a nested Stack navigator. Tapping a stock row **MUST** `navigation.navigate("StockChart", { symbol })`. The StockChartScreen **MUST** read the symbol from route params and call `loadChart`.

#### Scenario: Stock row tap navigates with params

- **GIVEN** the Stocks tab renders with a nested Stack containing StocksList and StockChart routes
- **WHEN** the user taps the AAPL row in StocksScreen
- **THEN** the StockChart screen mounts with `route.params.symbol === "AAPL"`
- **AND** `loadChart("AAPL", "1W")` is called on mount

### Requirement: Mobile Chart Tests

The mobile test suite **MUST** include ≥3 new passing tests covering the chart store `loadChart` action, the StocksRepository `getChart` contract, and StockChartScreen rendering with mock data. Total passing test count **MUST** be ≥117 (114 existing + ≥3 new).

#### Scenario: Chart store test passes

- **GIVEN** `stocks.store.test.ts` is updated with chart slice tests
- **WHEN** `pnpm -F mobile test` runs
- **THEN** ≥1 test covers `loadChart` success path
- **AND** ≥1 test covers `loadChart` error path
- **AND** ≥1 test covers StockChartScreen rendering
