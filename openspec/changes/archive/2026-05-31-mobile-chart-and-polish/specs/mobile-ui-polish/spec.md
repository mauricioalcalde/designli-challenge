# mobile-ui-polish Specification

## Purpose

Retrofit existing screens with the new design system and apply visual polish: card-based layouts, skeleton loaders, screen transitions, haptic feedback, and a branded login experience.

**Domain layer**: presentation

## Requirements

### Requirement: StocksScreen Card Layout

The StocksScreen **MUST** render each stock row as a Card component with trend indicator (▲ green / ▼ red), percentage change badge, and tactile press animation.

#### Scenario: Card renders stock data

- **GIVEN** stock items are loaded
- **WHEN** StocksScreen renders
- **THEN** each item is displayed as a Card with symbol, name, price, and change badge
- **AND** positive change shows a green ▲ icon with `Badge variant="success"`
- **AND** negative change shows a red ▼ icon with `Badge variant="error"`

#### Scenario: Card tap navigates to chart

- **GIVEN** a stock card for "AAPL" is rendered
- **WHEN** the user taps the card
- **THEN** haptic feedback **SHOULD** fire (`impactLight`)
- **AND** the app navigates to StockChartScreen with `{ symbol: "AAPL" }`

### Requirement: AlertsScreen Polish

The AlertsScreen **MUST** use styled Input and Button components for the alert creation form. Empty alert list **MUST** render EmptyState component.

#### Scenario: Alert form uses design system

- **GIVEN** the alert creation form renders
- **WHEN** displayed
- **THEN** symbol input uses `<Input>` with themed styling
- **AND** threshold input uses `<Input>` with numeric keyboard
- **AND** submit uses `<Button variant="primary">`

#### Scenario: Empty alert list

- **GIVEN** the user has no alerts
- **WHEN** AlertsScreen renders
- **THEN** an `<EmptyState>` displays with appropriate icon and message
- **AND** a "Create Alert" action button is visible

### Requirement: LoginScreen Branding

The LoginScreen **MUST** display a branded header with app name/logo, a gradient background, and smooth transition animations between auth states.

#### Scenario: Login screen renders branded header

- **GIVEN** the user is not authenticated
- **WHEN** LoginScreen renders
- **THEN** the app name/logo **MUST** appear as a header with `h1` typography
- **AND** the background **MUST** use a gradient from `theme.colors.primary` to `theme.colors.background`
- **AND** input fields use themed `<Input>` components

#### Scenario: Transition after successful login

- **GIVEN** the user submits valid credentials
- **WHEN** authentication succeeds
- **THEN** the screen **SHOULD** animate a fade or slide transition
- **AND** the MainTabs screen becomes visible

### Requirement: NotificationsSettingsScreen Polish

The NotificationsSettingsScreen **MUST** use Card-based layout for each notification preference section with themed toggle switches.

#### Scenario: Notification settings use cards

- **GIVEN** the notifications settings screen renders
- **WHEN** displayed
- **THEN** each settings group is wrapped in a `<Card>`
- **AND** toggle colors match `theme.colors.primary`

### Requirement: Global Skeleton Loaders

All data-dependent screens **MUST** display Skeleton components during initial data load. StocksScreen **MUST** show skeleton cards; AlertsScreen **MUST** show skeleton form rows.

#### Scenario: Stocks screen skeleton

- **GIVEN** the StocksScreen mounts and data is loading
- **WHEN** `isLoading` is `true`
- **THEN** skeleton card placeholders render matching the card layout dimensions
- **AND** real content replaces skeletons when `isLoading` becomes `false`

#### Scenario: Alerts screen skeleton

- **GIVEN** the AlertsScreen mounts and data is loading
- **WHEN** `isLoading` is `true`
- **THEN** skeleton placeholders render for the form area and alert list rows
- **AND** real content replaces skeletons when loading completes

### Requirement: Screen Transitions

Screen navigation **SHOULD** use animated transitions (fade or slide) between screens, respecting the current theme's animation duration token.

#### Scenario: Navigate with transition

- **GIVEN** the user is on StocksScreen
- **WHEN** navigating to StockChartScreen
- **THEN** a slide animation **SHOULD** play with duration matching the theme's transition token

### Requirement: Haptic Feedback

Interactive elements (card taps, button presses, toggle switches) **SHOULD** trigger light haptic feedback via `expo-haptics` `impactAsync(ImpactFeedbackStyle.Light)`.

#### Scenario: Button press triggers haptic

- **GIVEN** a `<Button onPress={handler}>` is rendered
- **WHEN** the user presses it
- **THEN** `ImpactFeedbackStyle.Light` haptic **SHOULD** fire before `handler` executes
