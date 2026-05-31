# Stocks Specification

## Purpose

Stock data listing, chart time-series retrieval, and provider abstraction. Establishes the provider pattern for external market data integration.

## Requirements

### Requirement: Shared Contracts

`packages/shared/src/types/stock.ts` **MUST** export `StockListing`, `StockChartPoint`, and `StockProviderConfig` as TypeScript types.

- GIVEN the shared package is installed
- WHEN importing `StockListing`, `StockChartPoint`, and `StockProviderConfig` from `@designli-challenge/shared`
- THEN all three types resolve and type-check without errors

### Requirement: Stock List Endpoint

`GET /stocks` **MUST** return an array of stock listings with symbol, name, and current price. The endpoint **MUST** be protected by `JwtAuthGuard`.

- GIVEN a valid JWT Bearer token
- WHEN GET /stocks is called
- THEN the response is HTTP 200 with body containing an array of `{ symbol, name, currentPrice, changePercent }`

- GIVEN no Authorization header
- WHEN GET /stocks is called
- THEN the response is HTTP 401

### Requirement: Stock Chart Endpoint

`GET /stocks/:symbol/chart` **MUST** accept an optional `range` query param (default `1W`) and return time-series OHLC data points. The endpoint **MUST** be protected by `JwtAuthGuard`.

- GIVEN a valid JWT Bearer token and a known stock symbol
- WHEN GET /stocks/AAPL/chart?range=1M is called
- THEN the response is HTTP 200 with body containing an array of `{ timestamp, open, high, low, close }`

- GIVEN a valid token and an unknown stock symbol
- WHEN GET /stocks/UNKNOWN/chart is called
- THEN the response is HTTP 404

### Requirement: Provider Abstraction

The system **MUST** define `IStockProvider` as an abstract class in `application/stocks/ports/` with methods `list()` and `chart(symbol, range)`. A `MockStockProvider` **MUST** implement it and return deterministic data. A `FinnhubStockProvider` **SHOULD** implement it. The active provider **MUST** be swappable via environment variable `STOCK_PROVIDER`.

- GIVEN `STOCK_PROVIDER=mock`
- WHEN GET /stocks is called
- THEN the response contains the mock stock listing data

- GIVEN `STOCK_PROVIDER=finnhub` and the Finnhub API is unreachable
- WHEN GET /stocks is called
- THEN the response is HTTP 503

### Requirement: Stocks Test Suite

The system **MUST** include ≥3 passing tests covering `IStockProvider` contract, `MockStockProvider`, and the stock controller.

- GIVEN the API workspace is set up
- WHEN `pnpm -F api test` runs
- THEN ≥3 tests pass covering provider interface contract, mock data shape, and controller auth guard
