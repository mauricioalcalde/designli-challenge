# Tasks: Mobile Chart & Polish

## Review Workload Forecast

| Field                   | Value                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| Estimated changed lines | 650-850                                                              |
| 400-line budget risk    | High                                                                 |
| Chained PRs recommended | Yes                                                                  |
| Suggested split         | PR 1 (chart infra + screen ~280), PR 2 (design system + polish ~520) |
| Delivery strategy       | auto-chain                                                           |
| Chain strategy          | feature-branch-chain                                                 |
| Base branch (PR 1)      | feature/mobile-chart-and-polish                                      |
| Base branch (PR 2)      | PR 1 branch                                                          |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                    | Likely PR | Notes                                                       |
| ---- | --------------------------------------- | --------- | ----------------------------------------------------------- |
| 1    | Chart infrastructure + StockChartScreen | PR 1      | Domain → data → store → screen → navigation; tests included |
| 2    | Design system + UI polish               | PR 2      | Theme + 6 components → 4 screen retrofits; tests included   |

## Phase 1: Chart Domain & Data (PR 1)

- [x] 1.1 [TEST] `__tests__/stocks.store.test.ts` — add `loadChart` success, failure, stale-discard tests (RED)
- [x] 1.2 Add `ChartRange` union type `'1D' \| '1W' \| '1M' \| '3M' \| '1Y'` to `packages/shared/src/types/stock.ts`
- [x] 1.3 Add `abstract chart(symbol, range): Promise<StockChartPoint[]>` to `StocksRepository` port
- [x] 1.4 Add `StockChartError` class (mirrors `StocksLoadError` pattern) to `stocks.errors.ts`
- [x] 1.5 Implement `chart()` in `StocksApi` via `GET /stocks/:symbol/chart?range=` with `StockChartError` wrapping
- [x] 1.6 Add chart state slice to `stocks.store.ts`: `chartData/chartSymbol/chartRange/chartIsLoading/chartError/loadChart` with stale-request abort (GREEN)
- [x] 1.7 Add deps to `package.json`: `victory-native`, `react-native-svg`, `expo-haptics`
- [x] 1.8 Run `pnpm install` to install new deps

## Phase 2: Chart Screen & Navigation (PR 1)

- [x] 2.1 [TEST] `__tests__/StockChartScreen.test.tsx` — render with mock data, timeframe tap, loading/error/empty states (RED)
- [x] 2.2 Create `StockChartScreen.tsx` — Victory line chart, timeframe pill selector (1D/1W/1M/3M/1Y), alert threshold overlay from `useAlertsStore`, haptic `impactLight`, loading/error/empty states
- [x] 2.3 Modify `StocksScreen.tsx` row `View` → `TouchableOpacity` with `navigation.navigate('StockChart', { symbol })` + haptic
- [x] 2.4 Convert Stocks tab in `MainTabs.tsx` to nested `createNativeStackNavigator` (StocksList + StockChart)

## Phase 3: Design System Foundation (PR 2)

- [ ] 3.1 [TEST] `__tests__/theme.test.tsx` — ThemeProvider toggles light↔dark, MMKV persists, `useTheme()` returns correct tokens (RED)
- [ ] 3.2 Create `theme/tokens.ts` — light + dark palettes (10 color tokens each), typography scale (h1-h4/body/caption), spacing (4/8/16/24/32), radii, shadows
- [ ] 3.3 Create `theme/types.ts` — `ThemeMode`, `ThemeTokens`, `ThemeContextValue`
- [ ] 3.4 Create `theme/ThemeProvider.tsx` — React Context + MMKV `getString/set` for persistence; hydrate on mount; `toggle()` method
- [ ] 3.5 Create `theme/useTheme.ts` — hook returning `{ mode, tokens, toggle }` (GREEN)

## Phase 4: Reusable Components (PR 2)

- [ ] 4.1 [TEST] `__tests__/components.test.tsx` — per-component render + variant + disabled/loading/error states (RED)
- [ ] 4.2 Create `Button.tsx` — variants: primary/secondary/outline/ghost; loading spinner; disabled opacity; haptic on press
- [ ] 4.3 Create `Card.tsx` — elevated with shadow; padding/radius/background from tokens; optional onPress
- [ ] 4.4 Create `Badge.tsx` — pill badge: success/warning/error/info color variants
- [ ] 4.5 Create `Input.tsx` — themed TextInput with label, error message, left/right icon slots
- [ ] 4.6 Create `EmptyState.tsx` — centered icon + title + subtitle + optional action button
- [ ] 4.7 Create `Skeleton.tsx` — `Animated` pulse placeholder: `Skeleton.Line`, `Skeleton.Card`, `Skeleton.Circle` subcomponents
- [ ] 4.8 Create `components/index.ts` barrel export for all 6 components (GREEN)

## Phase 5: Screen Retrofit & Polish (PR 2)

- [ ] 5.1 Wrap `<NavigationContainer>` children in `<ThemeProvider>` in `AppNavigator.tsx`
- [ ] 5.2 Retool `LoginScreen.tsx`: gradient background (primary→background), replace raw `TouchableOpacity`/`TextInput` with `Button`/`Input`, branded header with `h1` typography
- [ ] 5.3 Retool `AlertsScreen.tsx`: theme tokens (remove all hardcoded hex), `Card`/`Input`/`Button`/`Badge` for form + list, `Skeleton` during load, `EmptyState` when no alerts
- [ ] 5.4 Retool `NotificationsSettingsScreen.tsx`: `Card`-wrapped sections, theme tokens, `Button` for primary action
- [ ] 5.5 Retool `StocksScreen.tsx`: `Card` rows with `Badge` trend (▲green/▼red), `Skeleton` cards during load, haptic on press
- [ ] 5.6 Update existing screen tests (`LoginScreen`, `AlertsScreen`, `StocksScreen`, `NotificationsSettingsScreen`) — adjust assertions for new components + testIDs; remove StyleSheet references
- [ ] 5.7 `rg "#[0-9A-Fa-f]{6}" apps/mobile/src/presentation/screens/` — verify zero hardcoded hex remains

## Phase 6: Verification

- [ ] 6.1 Run `pnpm test:api` — confirm zero API regressions
- [ ] 6.2 Run `pnpm test:mobile` — confirm ≥117 tests pass (114 existing + ≥3 new chart)
- [ ] 6.3 Run `pnpm typecheck` — zero type errors
- [ ] 6.4 Run `pnpm lint` — zero lint errors
