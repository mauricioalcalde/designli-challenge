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

All data-dependent screens **MUST** display Skeleton components during initial data load. StocksScreen **MUST** show skeleton cards; AlertsScreen **MUST** show skeleton form rows; StockChartScreen **MUST** show a skeleton in the chart area. Skeleton widths **MUST** be responsive.

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

#### Scenario: Chart screen skeleton

- **GIVEN** the StockChartScreen mounts and chart data is loading
- **WHEN** `chartIsLoading` is `true`
- **THEN** a skeleton placeholder renders in the chart container area
- **AND** real chart replaces skeleton when loading completes

### Requirement: Stock Detail and Chart Quality

The stock detail screen **MUST** present a professional hero card, a well-formatted chart with correct Y-axis scaling, a skeleton loading state, clear CTA placement, and pull-to-refresh.

#### Scenario: Hero card with price and change

- **GIVEN** the stock detail screen loads with quote data
- **WHEN** the screen renders
- **THEN** a hero card displays the current price, change amount, and change percentage
- **AND** positive/negative change uses the appropriate semantic color

#### Scenario: Chart Y-axis scales to data

- **GIVEN** chart data points are loaded
- **WHEN** the chart renders
- **THEN** the Y-axis min and max **MUST** scale to the data range
- **AND** labels do not overlap or clip

#### Scenario: Skeleton loading state for chart

- **GIVEN** chart data is loading
- **WHEN** `chartIsLoading` is `true`
- **THEN** a skeleton placeholder renders in the chart area
- **AND** no text-only "Loading..." message is the sole feedback

#### Scenario: Create Alert CTA placement

- **GIVEN** the stock detail screen is visible with data loaded
- **WHEN** the user reviews the chart
- **THEN** a "Create Alert" CTA is prominently placed and tappable

### Requirement: Stocks Browsing Quality

The Stocks home **MUST** present a professional product header, a last-updated or live indicator, richer stock cards with clear drill-down affordance, and consolidated empty/error/offline states without duplicate retry buttons.

#### Scenario: Product header with freshness indicator

- **GIVEN** stock data is loaded
- **WHEN** the Stocks home renders
- **THEN** a header section displays the market or portfolio title
- **AND** a last-updated timestamp or live indicator is visible

#### Scenario: Stock cards show drill-down affordance

- **GIVEN** stock rows render as cards
- **WHEN** the user views the list
- **THEN** each card includes a visual cue (chevron, arrow, or tap hint) indicating tap navigates to detail

#### Scenario: No duplicate retry buttons in error state

- **GIVEN** the stocks screen is in an error state
- **WHEN** the error UI renders
- **THEN** exactly one retry action is visible
- **AND** no duplicate retry buttons from overlapping components appear

### Requirement: Alert Creation Quality

The CreateAlert screen **MUST** provide a segmented direction control, contextual preview copy, input validation, and clear success/offline/pending feedback.

#### Scenario: Segmented direction control

- **GIVEN** the alert creation form renders
- **WHEN** the user selects a direction
- **THEN** a segmented control (Above/Below) is used instead of a plain text input
- **AND** the selected segment is visually highlighted

#### Scenario: Contextual preview copy

- **GIVEN** the user has entered a symbol and threshold
- **WHEN** the form is valid
- **THEN** a preview sentence reads like "Alert when AAPL goes above $180"

#### Scenario: Validation before submit

- **GIVEN** the user has not entered a valid symbol or threshold
- **WHEN** the submit button is tapped
- **THEN** the form shows inline validation errors
- **AND** the submit is prevented until the form is valid

#### Scenario: Success and offline feedback

- **GIVEN** the user submits a valid alert
- **WHEN** creation succeeds online
- **THEN** a success confirmation is shown
- **WHEN** the device is offline
- **THEN** a "saved locally, pending sync" message is shown

### Requirement: Alerts List Quality

The Alerts list screen **MUST** display alert states (active, triggered, pending, failed), timestamps, a clear empty state, and a create-alert CTA. Pull-to-refresh **MUST** be available.

#### Scenario: Alert state badges

- **GIVEN** the user has alerts in various states
- **WHEN** the list renders
- **THEN** each alert row shows a state badge (Active, Triggered, Pending, Failed) using semantic colors

#### Scenario: Timestamps on alert rows

- **GIVEN** alerts have creation or trigger timestamps
- **WHEN** the list renders
- **THEN** each row displays a human-readable relative timestamp

#### Scenario: Empty state with create CTA

- **GIVEN** the user has no alerts
- **WHEN** the list renders
- **THEN** an empty state with a message and a "Create Alert" CTA button is shown

#### Scenario: Pull-to-refresh on alerts list

- **GIVEN** the alerts list is visible
- **WHEN** the user pulls down to refresh
- **THEN** the list re-fetches alerts from the API
- **AND** a refresh indicator is shown during the fetch

### Requirement: Profile and Settings Quality

The Profile screen **MUST** present credible user data (email, avatar placeholder, app version, legal links), integrate notification settings, and provide reliable logout. No placeholder emptiness is allowed.

#### Scenario: Profile displays user data

- **GIVEN** the user is authenticated
- **WHEN** the Profile screen renders
- **THEN** the user email is displayed
- **AND** an avatar placeholder or initials are shown
- **AND** the app version is visible

#### Scenario: Notification settings integration

- **GIVEN** the Profile screen renders
- **WHEN** the user taps notification settings
- **THEN** navigation routes to the NotificationsSettings screen within the profile stack

#### Scenario: Logout from profile

- **GIVEN** the Profile screen is visible
- **WHEN** the user taps logout
- **THEN** a confirmation prompt appears
- **AND** confirming triggers `logout()` which completes without crash
- **AND** the app navigates to the auth screen

#### Scenario: No placeholder emptiness

- **GIVEN** the Profile screen renders with user data available
- **WHEN** the screen is displayed
- **THEN** no "Coming soon" or placeholder text is shown

### Requirement: Notifications Status Quality

The NotificationsSettings screen **MUST** clearly communicate permission state, device-token registration state, errors, and the purpose of notifications.

#### Scenario: Permission state clarity

- **GIVEN** the notifications settings screen renders
- **WHEN** push permission is denied or not requested
- **THEN** the screen explains why notifications matter and how to enable them

#### Scenario: Registration state display

- **GIVEN** the device token is registered
- **WHEN** the settings screen renders
- **THEN** the registration status is indicated (registered or pending)

#### Scenario: Registration error with retry

- **GIVEN** device token registration fails
- **WHEN** the error state renders
- **THEN** a clear error message and retry action are shown

### Requirement: Visual QA Documentation

The project **MUST** produce `docs/VISUAL_QA.md` with a screen-by-screen checklist and `docs/UI_REDESIGN_PLAN.md` summarizing the polish pass. Each screen **SHOULD** have screenshot evidence attached or referenced.

#### Scenario: Visual QA checklist exists

- **GIVEN** the E2E hardening change is complete
- **WHEN** a reviewer opens `docs/VISUAL_QA.md`
- **THEN** every screen has a checklist entry covering layout, states, and theme consistency

#### Scenario: UI redesign plan summarizes changes

- **GIVEN** the hardening change is complete
- **WHEN** a reviewer opens `docs/UI_REDESIGN_PLAN.md`
- **THEN** the document summarizes what was polished, why, and what remains

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
