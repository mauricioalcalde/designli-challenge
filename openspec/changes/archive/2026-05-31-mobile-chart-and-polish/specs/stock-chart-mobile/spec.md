# stock-chart-mobile Specification

## Purpose

Interactive stock chart visualization on mobile. Renders line charts from `GET /stocks/:symbol/chart` with timeframe filtering, alert threshold overlay, and pull-to-refresh. Navigable from the stock list screen.

**Domain layer**: presentation + application

## Requirements

### Requirement: Chart Screen Rendering

The system **MUST** render an interactive line chart via `victory-native` consuming `StockChartPoint[]` data from `GET /stocks/:symbol/chart`. The chart **SHALL** display close-price as a line series with labeled axes and **SHOULD** support touch-to-inspect tooltips.

#### Scenario: Chart renders with valid data

- **GIVEN** a valid JWT token and symbol "AAPL" with `range=1W`
- **WHEN** the StockChartScreen mounts
- **THEN** a line chart renders with ≥30 OHLC data points
- **AND** the x-axis shows date labels and y-axis shows price labels

#### Scenario: Chart renders with single data point

- **GIVEN** a symbol whose chart endpoint returns exactly 1 data point
- **WHEN** the StockChartScreen mounts
- **THEN** the chart **SHOULD** render a single-point marker without crashing
- **AND** no line segments are drawn

### Requirement: Timeframe Selector

The system **MUST** provide a segmented control with options `[1D, 1W, 1M, 3M, 1Y]`. Selecting a timeframe **MUST** re-fetch chart data with the corresponding `range` query param and re-render the chart.

#### Scenario: Timeframe switch triggers re-fetch

- **GIVEN** the chart is rendered with `1W` data
- **WHEN** the user taps the `1M` segment
- **THEN** `GET /stocks/AAPL/chart?range=1M` is called
- **AND** the chart re-renders with the new data series

#### Scenario: Rapid timeframe switching

- **GIVEN** the user rapidly taps `1D`, `1M`, `1Y` in sequence
- **WHEN** each tap triggers a fetch
- **THEN** only the last requested timeframe's data **MUST** be displayed
- **AND** stale responses **MUST** be discarded

### Requirement: Stock-List-to-Chart Navigation

Tapping a stock row in StocksScreen **MUST** navigate to StockChartScreen within a nested Stack navigator inside the Stocks tab. The chart screen **MUST** receive the stock symbol as a route param.

#### Scenario: Tap stock row navigates to chart

- **GIVEN** the StocksScreen displays a list including "AAPL"
- **WHEN** the user taps the AAPL row
- **THEN** the navigator pushes StockChartScreen with `{ symbol: "AAPL" }`
- **AND** the chart begins loading AAPL data

### Requirement: Chart Loading, Error, and Empty States

The StockChartScreen **MUST** handle loading, error, and empty states.

#### Scenario: Loading state

- **GIVEN** the chart data is being fetched
- **WHEN** the screen is rendering
- **THEN** a skeleton loader or activity indicator is displayed in the chart area
- **AND** the timeframe selector is visible but non-interactive

#### Scenario: Error state

- **GIVEN** the chart fetch fails (network error or server error)
- **WHEN** the error is received
- **THEN** an error message is displayed with a retry button
- **AND** the timeframe selector remains interactive

#### Scenario: Empty state (no data)

- **GIVEN** the chart endpoint returns an empty array `[]`
- **WHEN** the response is received
- **THEN** an empty-state message is displayed (e.g., "No chart data available")

### Requirement: Alert Threshold Overlay

When the user has active alerts for the viewed symbol, the system **SHOULD** overlay horizontal threshold lines on the chart at the alert trigger prices, labeled with the alert description.

#### Scenario: Threshold line renders for matching symbol

- **GIVEN** the user has an alert for AAPL at price $180.00
- **WHEN** StockChartScreen renders with AAPL chart data
- **THEN** a dashed horizontal line appears at the $180.00 y-axis level
- **AND** the line is labeled with the alert description

#### Scenario: No threshold when no matching alert

- **GIVEN** the user has no alerts for symbol "MSFT"
- **WHEN** StockChartScreen renders with MSFT chart data
- **THEN** no threshold overlay lines are rendered

### Requirement: Pull-to-Refresh

The chart screen **MUST** support pull-to-refresh to re-fetch chart data for the current symbol and selected timeframe.

#### Scenario: Pull-to-refresh re-fetches

- **GIVEN** the chart is displaying 1W AAPL data
- **WHEN** the user performs a pull-to-refresh gesture
- **THEN** the current timeframe's data is re-fetched
- **AND** the chart updates with the latest data

### Requirement: Chart Test Suite

The system **MUST** include tests for the chart store, chart screen rendering, and timeframe interactions. Tests **MUST** use mocked API responses and **SHALL** verify loading, error, and data states.

#### Scenario: Chart store integration test

- **GIVEN** a Zustand chart store created with a mock repository
- **WHEN** `loadChart(symbol, timeframe)` is dispatched
- **THEN** `isLoading` transitions `true → false` and `chartPoints` populates with mock data

#### Scenario: Chart screen renders mock data

- **GIVEN** the chart store is preloaded with mock StockChartPoint data
- **WHEN** StockChartScreen renders
- **THEN** the chart component is present in the render tree
- **AND** timeframe selector segments are visible and tappable
