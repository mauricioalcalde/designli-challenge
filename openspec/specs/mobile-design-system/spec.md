# mobile-design-system Specification

## Purpose

Establish a reusable design system for the mobile app: theme provider, design tokens, and six shared components. Ensures visual consistency across all screens and enables dark mode via persisted user preference.

**Domain layer**: presentation

## Requirements

### Requirement: Theme Provider

The system **MUST** provide a React Context-based `ThemeProvider` that exposes `{ theme, toggleTheme, isDark }`. Themes **MUST** include `light` and `dark` variants. All descendant components **SHALL** consume theme values via a `useTheme()` hook.

#### Scenario: Theme provider wraps app

- **GIVEN** the app root wraps children in `<ThemeProvider>`
- **WHEN** any descendant component calls `useTheme()`
- **THEN** it receives `{ theme, toggleTheme, isDark }` without undefined values

#### Scenario: Toggle switches theme

- **GIVEN** the current theme is `light`
- **WHEN** `toggleTheme()` is called
- **THEN** `isDark` becomes `true` and `theme` reflects `dark` palette values
- **AND** calling `toggleTheme()` again returns to `light`

### Requirement: Design Tokens

The theme object **MUST** include:

| Token Group  | Contents                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `colors`     | `primary`, `secondary`, `background`, `surface`, `text`, `error`, `success`, `warning`, `border`, `chartLine`, `chartFill` |
| `typography` | `h1`–`h4`, `body`, `caption` with `{ fontSize, fontWeight, lineHeight }`                                                   |
| `spacing`    | `xs(4)`, `sm(8)`, `md(16)`, `lg(24)`, `xl(32)`                                                                             |
| `radii`      | `sm(4)`, `md(8)`, `lg(12)`, `full(9999)`                                                                                   |
| `shadows`    | `none`, `sm`, `md`, `lg`                                                                                                   |

#### Scenario: Color tokens adapt to theme

- **GIVEN** `isDark` is `true`
- **WHEN** `useTheme()` is called
- **THEN** `theme.colors.background` **MUST** be a dark color (e.g., `#121212`)
- **AND** `theme.colors.text` **MUST** be a light color for readability

#### Scenario: Typography scale is consistent

- **GIVEN** `theme.typography.h1`
- **WHEN** applied to a `<Text>` component
- **THEN** it **MUST** have `fontSize` larger than `h2`, which is larger than `body`

### Requirement: Theme Persistence

The selected theme **MUST** be persisted via MMKV and restored on app launch before any screen renders, preventing a flash of wrong theme.

#### Scenario: Dark mode persists across restarts

- **GIVEN** the user toggled dark mode on in a previous session
- **WHEN** the app launches
- **THEN** the dark theme is applied immediately without a visible flash
- **AND** `isDark` is `true`

#### Scenario: First launch defaults to light

- **GIVEN** the app has never been launched
- **WHEN** the app starts
- **THEN** `light` theme is the default

### Requirement: Reusable Components

The system **MUST** provide six reusable components, each handling at minimum a default and disabled variant:

| Component    | Variants                                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| `Button`     | `primary`, `secondary`, `outline`; `disabled`; `loading` (spinner + text)       |
| `Card`       | elevated with shadow, optional `onPress`                                        |
| `Badge`      | `success`, `warning`, `error`, `info`                                           |
| `Input`      | `default`, `error` (red border + message), `disabled`                           |
| `EmptyState` | icon, title, subtitle, optional `action` button                                 |
| `Skeleton`   | animated placeholder matching child dimensions; `circle`, `rect`, `text` shapes |

#### Scenario: Button loading state

- **GIVEN** a `<Button loading>` is rendered
- **WHEN** the button is displayed
- **THEN** a spinner is visible alongside the button text
- **AND** the button is non-interactive (onPress does not fire)

#### Scenario: Input error state

- **GIVEN** an `<Input error="Required field">` is rendered
- **WHEN** displayed
- **THEN** the input border is `theme.colors.error`
- **AND** the error message is displayed below the input

#### Scenario: Skeleton matches content shape

- **GIVEN** a `<Skeleton variant="rect" width={200} height={20}>` is rendered
- **WHEN** displayed
- **THEN** a pulsing placeholder rectangle of 200×20 is visible
- **AND** it has no interaction behavior

#### Scenario: EmptyState with action

- **GIVEN** an `<EmptyState title="No alerts" action={{ label: "Create", onPress }}>` is rendered
- **WHEN** the user taps the action button
- **THEN** `onPress` is called

### Requirement: Component Test Coverage

All six reusable components **MUST** have test coverage verifying default render, each variant, and disabled/loading/error states where applicable.

#### Scenario: Component variant tests

- **GIVEN** the test suite for `<Button>`
- **WHEN** tests run
- **THEN** at minimum: renders primary, renders secondary, renders outline, renders disabled (non-interactive), renders loading (spinner visible)
