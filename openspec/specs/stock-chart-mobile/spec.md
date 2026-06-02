# stock-chart-mobile Specification

## Purpose

Deliver the premium mobile stocks experience: a redesigned market home, an elevated stock detail chart view, and standardized offline/cached-data feedback while preserving existing data/store contracts.

**Domain layer**: presentation + application

## Requirements

### Requirement: Premium Stocks Home

The Stocks home **MUST** render as a premium market overview with summary tiles, styled stock rows, and unified loading, error, empty, stale-data, and offline states.

#### Scenario: Offline stocks home with cached data

- **GIVEN** cached stock data exists and the device is offline
- **WHEN** the user opens the Stocks home
- **THEN** the UI shows `Offline` and `Showing cached data`
- **AND** a visible `Retry` action remains available

### Requirement: Premium Stock Detail Chart

The stock detail screen **MUST** present a premium hero, timeframe pills, and an elevated chart container using the approved dark surfaces and coral-primary chart styling. The implementation **MUST** preserve existing chart data contracts and refresh behavior.

#### Scenario: Premium chart styling renders

- **GIVEN** chart data is available for a stock symbol
- **WHEN** the detail screen renders
- **THEN** the chart uses premium dark surfaces, subtle grid lines, legible labels, and the coral primary chart color

#### Scenario: Cached-data fallback on detail

- **GIVEN** cached quote or chart data exists and the network request fails
- **WHEN** the stock detail screen renders
- **THEN** the UI shows cached-data messaging and a retry action

### Requirement: Timeframe and Refresh Interactions

The detail screen **MUST** expose timeframe pills `[1D, 1W, 1M, 3M, 1Y]`, re-fetch the selected range, discard stale responses, and support pull-to-refresh for the current symbol and range.

#### Scenario: Timeframe switch re-fetches current symbol

- **GIVEN** the stock detail screen is showing one timeframe
- **WHEN** the user selects another timeframe pill
- **THEN** the screen requests chart data for the current symbol and new range
- **AND** only the latest response is displayed

### Requirement: Stocks Detail Action Surface

The detail screen **MUST** include a `Create Alert` CTA that routes into the alert creation flow without changing alert business behavior.

#### Scenario: Create alert CTA is available

- **GIVEN** the stock detail screen is visible
- **WHEN** the user reviews the premium chart experience
- **THEN** a `Create Alert` action is available from that screen

### Requirement: Premium Stocks Test Coverage

The mobile suite **MUST** cover the premium stocks home, stock detail chart, timeframe interactions, retry behavior, and chart styling with passing tests.

#### Scenario: Premium stocks suites pass

- **GIVEN** the mobile workspace is set up
- **WHEN** the targeted stocks and chart suites run
- **THEN** the premium stocks experience passes runtime verification without introducing new TypeScript errors in changed files
