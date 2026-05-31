# Design: Mobile Chart & Polish

## Technical Approach

Extend the existing Clean Architecture layers for chart data: add `chart(symbol, range)` to the domain port, implement via Axios in `StocksApi`, add chart state slice + `loadChart` action to the existing stocks store, render with `victory-native` in a new `StockChartScreen`. Build the design system as a React Context + MMKV theme provider (proposal-mandated), then retrofit all 4 existing screens with tokens and the 6 reusable components. Deliver as 2 chained PRs: PR 1 (chart infrastructure + screen), PR 2 (design system + polish).

## Architecture Decisions

### Decision 1: Chart Library

| Option                     | Tradeoff                                                                          | Decision                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **victory-native ^41**     | Mature, interactive touch API, tree-shakeable module imports; ~120KB gzipped      | **Selected** — proposal-mandated; best interactive line chart with threshold overlay support; modular imports reduce bundle impact |
| react-native-chart-kit     | Lighter (~30KB); limited interactivity, no threshold reference line API           | Rejected — insufficient for alert threshold overlay                                                                                |
| react-native-gifted-charts | Lightweight (~60KB), good RN compat; smaller community, fewer production examples | Rejected — lower maturity for interactive overlays                                                                                 |

### Decision 2: Theme System

| Option                      | Tradeoff                                                                                                                          | Decision                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **React Context + MMKV**    | Idiomatic RN theming; MMKV already in stack for token/snapshot storage; re-renders all consumers but theme toggles are infrequent | **Selected** — proposal-mandated; zero new deps; consistent with existing infrastructure |
| Zustand (already installed) | Selective subscriptions avoid full re-renders; theming is cross-cutting context, not application state                            | Rejected — not idiomatic for theming; over-engineered for the use case                   |

### Decision 3: Component Strategy

| Option                           | Tradeoff                                                                                                    | Decision                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Custom from RN primitives**    | Zero extra deps, full design token alignment, matches existing codebase convention (all screens are raw RN) | **Selected** — 6 simple components; avoids 200-400KB of UI library for elements that are trivial to build |
| react-native-paper / native-base | Mature but heavy (300-400KB+); opinionated Material Design styling                                          | Rejected — disproportionate bundle cost for scope                                                         |

### Decision 4: Dark Mode Persistence

| Option       | Tradeoff                                                                                       | Decision                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **MMKV**     | Sync, fast, already installed and used by `token-storage.mmkv.ts` and `stock-snapshot.mmkv.ts` | **Selected** — zero new deps; follows existing storage standard |
| AsyncStorage | Built-in, async; slower cold-start reads                                                       | Rejected — MMKV is already the project's KV storage             |

### Decision 5: Screen Transition Animations

| Option                                                                      | Tradeoff                                                               | Decision                                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Native stack animations** (react-native-screens ~3.34, already installed) | Zero config, native driver performance, already in place for AuthStack | **Selected** — no new deps; push/pop animations sufficient for stock-list→chart |
| react-native-reanimated                                                     | Custom animation power but adds dependency + learning curve            | Rejected — overkill for a simple push transition                                |

### Decision 6: Skeleton Loader

| Option                            | Tradeoff                                                                                           | Decision                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Custom `Skeleton` component**   | Part of the 6 reusable components; matches design tokens exactly; animated pulse via RN `Animated` | **Selected** — consistent with custom component strategy |
| react-native-skeleton-placeholder | Ready-made; adds dependency for a component we're building anyway                                  | Rejected — unnecessary dependency                        |

## Data Flow

### Chart Loading

```
StockChartScreen          stocksStore                StocksApi           Backend
     │                         │                         │                  │
     ├─mount(symbol)──────────→│                         │                  │
     │                         ├─loadChart(AAPL,'1W')───→│                  │
     │                         │                         ├─GET /stocks/     │
     │                         │                         │  AAPL/chart?     │
     │                         │                         │  range=1W───────→│
     │                         │                         │←─StockChartPt[]──│
     │                         │←─{chartData,loading:F}──│                  │
     │←─VictoryChart renders──│                         │                  │
     │                         │                         │                  │
     ├─tap '1M'──────────────→│                         │                  │
     │                         ├─loadChart(AAPL,'1M')───→│  (re-fetches)    │
```

### Theme Switching

```
User toggles switch  →  ThemeProvider.toggle()
    ├─ MMKV.set('theme','dark')
    └─ Context value updates (tokens flip)
           ├─ StocksScreen   ← useTheme() re-renders
           ├─ StockChartScreen ← chart line + timeframe recolor
           ├─ AlertsScreen   ← cards/inputs recolor
           ├─ LoginScreen    ← gradient swaps
           └─ NotificationsScreen ← cards recolor
```

### Navigation: Nested Stack

```
MainTabs (Bottom Tabs)
  └── Stocks (NativeStackNavigator)
        ├── StocksList    → StocksScreen (existing, modified: row onPress)
        └── StockChart    → StockChartScreen (new, receives {symbol} param)
  └── Alerts
  └── Notifications
```

## File Changes

| File                                                                   | Action | Description                                                                                                                                                         |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/types/stock.ts`                                   | Modify | Add `ChartRange` union type (`'1D' \| '1W' \| '1M' \| '3M' \| '1Y'`)                                                                                                |
| `apps/mobile/src/domain/stocks.repository.port.ts`                     | Modify | Add `chart(symbol: string, range: ChartRange): Promise<StockChartPoint[]>` abstract method                                                                          |
| `apps/mobile/src/domain/stocks.errors.ts`                              | Modify | Add `StockChartError` class (mirrors `StocksLoadError` pattern)                                                                                                     |
| `apps/mobile/src/data/stocks.api.ts`                                   | Modify | Implement `chart()` via `GET /stocks/:symbol/chart?range={range}`                                                                                                   |
| `apps/mobile/src/application/stocks.store.ts`                          | Modify | Add chart state slice: `chartData`, `chartSymbol`, `chartRange`, `chartIsLoading`, `chartError`, `loadChart` action                                                 |
| `apps/mobile/src/presentation/screens/StockChartScreen.tsx`            | Create | Victory line chart, timeframe pill selector, alert threshold horizontal lines from `useAlertsStore`, haptic feedback via `expo-haptics`, loading/error/empty states |
| `apps/mobile/src/presentation/screens/StocksScreen.tsx`                | Modify | Replace `View` row with `TouchableOpacity` → `navigation.navigate('StockChart', { symbol })`                                                                        |
| `apps/mobile/src/presentation/navigation/MainTabs.tsx`                 | Modify | Stocks tab becomes nested `createNativeStackNavigator` with `StocksList` + `StockChart` screens                                                                     |
| `apps/mobile/src/presentation/navigation/AppNavigator.tsx`             | Modify | Wrap `<NavigationContainer>` children with `<ThemeProvider>`                                                                                                        |
| `apps/mobile/src/presentation/theme/tokens.ts`                         | Create | Design tokens: color palette (light + dark), typography scale, spacing scale (4/8/12/16/24/32), radii, shadows                                                      |
| `apps/mobile/src/presentation/theme/types.ts`                          | Create | `ThemeMode`, `ThemeTokens`, `ThemeContextValue` TypeScript types                                                                                                    |
| `apps/mobile/src/presentation/theme/ThemeProvider.tsx`                 | Create | React Context + MMKV persistence; `toggle()` method; hydrate from MMKV on mount                                                                                     |
| `apps/mobile/src/presentation/theme/useTheme.ts`                       | Create | `useTheme()` hook returning `{ mode, tokens, toggle }`                                                                                                              |
| `apps/mobile/src/presentation/components/Button.tsx`                   | Create | Variants: primary/secondary/outline/ghost; loading spinner; disabled opacity; haptic on press                                                                       |
| `apps/mobile/src/presentation/components/Card.tsx`                     | Create | Elevated card: padding, radius, background from tokens; optional onPress                                                                                            |
| `apps/mobile/src/presentation/components/Badge.tsx`                    | Create | Pill badge with success/warning/error/info variants                                                                                                                 |
| `apps/mobile/src/presentation/components/Input.tsx`                    | Create | Themed TextInput with label, error message, left/right icon slots                                                                                                   |
| `apps/mobile/src/presentation/components/EmptyState.tsx`               | Create | Centered icon + title + subtitle + optional action button                                                                                                           |
| `apps/mobile/src/presentation/components/Skeleton.tsx`                 | Create | Animated pulse placeholder: `Skeleton.Line`, `Skeleton.Card`, `Skeleton.Circle` subcomponents                                                                       |
| `apps/mobile/src/presentation/components/index.ts`                     | Create | Barrel export for all 6 components                                                                                                                                  |
| `apps/mobile/src/presentation/screens/LoginScreen.tsx`                 | Modify | Branded gradient background; replace raw TouchableOpacity → Button, TextInput → Input                                                                               |
| `apps/mobile/src/presentation/screens/AlertsScreen.tsx`                | Modify | Replace raw styles with theme tokens; use Card/Input/Button/Badge/Skeleton; skeleton during initial load                                                            |
| `apps/mobile/src/presentation/screens/NotificationsSettingsScreen.tsx` | Modify | Replace raw styles with theme tokens; use Card/Button                                                                                                               |
| `apps/mobile/package.json`                                             | Modify | Add `victory-native`, `react-native-svg`, `expo-haptics`                                                                                                            |

## Interfaces / Contracts

```typescript
// Shared type (packages/shared/src/types/stock.ts)
export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y';

// Domain port (unchanged signature pattern, new method)
abstract chart(symbol: string, range: ChartRange): Promise<StockChartPoint[]>;

// Store chart slice (extension of existing StocksState)
chartData: StockChartPoint[];
chartSymbol: string | null;
chartRange: ChartRange;
chartIsLoading: boolean;
chartError: string | null;
loadChart: (symbol: string, range: ChartRange) => Promise<void>;

// Theme context
interface ThemeContextValue {
  mode: 'light' | 'dark';
  tokens: ThemeTokens;
  toggle: () => void;
}
```

## Testing Strategy

| Layer      | What to Test                                                                                                        | Approach                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Store      | `loadChart` success, failure, loading state transitions                                                             | jest mock `StocksRepository`, assert Zustand state (pattern: existing `stocks.store.test.ts`)         |
| Screen     | StockChartScreen renders line, timeframe selector switches and re-fetches, alert overlay lines, loading/error/empty | RNTL render with mocked stores (`useStocksStore`, `useAlertsStore`); fireEvent on timeframe pills     |
| Theme      | ThemeProvider toggles light↔dark, MMKV persists preference, `useTheme()` returns correct tokens                     | jest mock MMKV `createMMKV`; render consumer; assert token values                                     |
| Components | Button variants render, Card renders children, Skeleton pulses, EmptyState shows action                             | RNTL per-variant render; snapshot or testID assertions                                                |
| Navigation | Stock row tap navigates to StockChartScreen with correct symbol param                                               | RNTL render MainTabs with mocked stores; fireEvent.press row; assert StockChartScreen testID + symbol |

## Risks

| Risk                                                                 | Mitigation                                                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Victory-native ^41 not available via Expo SDK 52                     | Pin to exact compatible version; `react-native-svg` is already a peer-dep of Expo 52                                 |
| Chart re-renders on timeframe switch causing flicker                 | `React.memo` VictoryChart; use `key={range}` to force clean mount on data change                                     |
| Hardcoded hex colors across 4 screens — systematic grep needed       | `rg "#[0-9A-Fa-f]{6}" apps/mobile/src/presentation/screens/` to catalog all; replace per-screen in PR 2              |
| Nested Stack breaks existing Stocks tab testIDs                      | Keep `Stocks` tab label; `StockChart` is separate Stack screen; existing StocksScreen testIDs unchanged              |
| 6 reusable components add ~400 lines → may exceed 400-line PR budget | PR 1 (chart ~250 lines) stays under; PR 2 (design system + retrofit ~350-400 lines) borderline — monitor actual diff |
