# Proposal: Mobile Chart & Polish

## Intent

Mobile lacks stock chart visualization (challenge requirement #4) despite backend `GET /stocks/:symbol/chart` returning OHLC data. UI is wireframe-level: hardcoded hex colors, no dark mode, no loading skeletons, no branded identity. This change delivers the interactive chart and a full visual overhaul.

## Scope

### In Scope

- Interactive line chart with 1D/1W/1M/3M/1Y timeframe selector and alert threshold overlay
- Chart navigation from stock list row tap (nested Stack inside Stocks tab)
- Design system: color palette, typography scale, spacing, radii, shadows; dark mode (persisted via MMKV)
- Six reusable components: Button, Card, Badge, Input, EmptyState, Skeleton
- Card-based stock layouts, skeleton loaders, screen transitions, haptic feedback, branded login gradient
- Loading/error/empty states for chart screen
- Tests: chart store, chart screen, theme provider, reusable components

### Out of Scope

- Candlestick/OHLC bar chart, animated chart transitions, alert notification UI redesign, backend changes

## Capabilities

### New Capabilities

- **`stock-chart-mobile`**: Interactive `victory-native` line chart consuming `GET /stocks/:symbol/chart`. Timeframe selector. Alert threshold overlay. Stock-list-to-chart navigation.
- **`mobile-design-system`**: Theme provider (light/dark), design tokens, 6 reusable components (Button, Card, Badge, Input, EmptyState, Skeleton). Persisted preference.
- **`mobile-ui-polish`**: Skeleton loaders, screen transitions, haptic feedback, card layouts, branded login.

### Modified Capabilities

- **`stocks`**: Extend `StocksRepository` domain port with `chart(symbol, range): StockChartPoint[]`. Add `StockChartScreen`. Wire row tap → chart via nested Stack navigator.

## Approach

Clean Architecture layering: extend domain port → implement in data layer → add Zustand chart slice → build presentation screen with `victory-native`. Theme via React Context with MMKV persistence. Polish incrementally: shared components first, then retrofit each screen. Deliver as chained PRs (PR 1: chart infrastructure + screen, PR 2: design system + polish).

## Affected Areas

| Area                                        | Impact   | Description                                      |
| ------------------------------------------- | -------- | ------------------------------------------------ |
| `domain/stocks.repository.port.ts`          | Modified | Add `chart(symbol, range)`                       |
| `data/stocks.api.ts`                        | Modified | Implement chart HTTP call                        |
| `application/stocks.store.ts`               | Modified | Chart state + `loadChart` action                 |
| `presentation/screens/StockChartScreen.tsx` | New      | Interactive chart + timeframe selector           |
| `presentation/screens/StocksScreen.tsx`     | Modified | TouchableOpacity row → navigate                  |
| `presentation/navigation/MainTabs.tsx`      | Modified | Nested Stack for stock list → chart              |
| `presentation/components/`                  | New (6)  | Button, Card, Badge, Input, EmptyState, Skeleton |
| `presentation/theme/`                       | New      | ThemeProvider, tokens, useTheme hook             |
| `presentation/screens/*` (4 existing)       | Modified | Apply design system + polish                     |
| `apps/mobile/package.json`                  | Modified | Add victory-native, react-native-svg             |

## Risks

| Risk                                  | Likelihood | Mitigation                                       |
| ------------------------------------- | ---------- | ------------------------------------------------ |
| Victory-native bundle size increase   | Med        | Tree-shake; modular imports                      |
| Dark mode breaks existing testIDs     | Low        | Theme via context; test wrapper                  |
| Navigation restructure breaks tests   | Low        | Keep tab structure; Stack inside Stocks tab only |
| Chart render perf with large datasets | Low        | Limit data points per timeframe; memoize         |

## Rollback Plan

Remove `victory-native` + `react-native-svg` deps. Delete `StockChartScreen.tsx`. Revert `StocksScreen` row to non-navigable `<View>`. Revert port/api/store chart additions. Revert theme provider and components. All changes are additive or scoped — no shared infrastructure coupling.

## Dependencies

- `victory-native` ^41.x + `react-native-svg` (chart library)
- `expo-haptics` (bundled in Expo SDK 52)

## Success Criteria

- [ ] Chart renders line graph for AAPL 1W with ≥30 data points
- [ ] Timeframe selector switches between 1D/1W/1M/3M/1Y and re-fetches
- [ ] Stock row tap navigates to chart screen with correct symbol
- [ ] Dark mode toggle persists across app restarts
- [ ] All screens render correctly in both themes
- [ ] Skeleton loaders appear during initial Stocks/Alerts load
- [ ] 114 existing + new chart/theme tests pass (`pnpm -F mobile test`)
- [ ] Reusable components have test coverage
