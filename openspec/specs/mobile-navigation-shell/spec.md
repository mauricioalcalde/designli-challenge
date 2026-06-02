# mobile-navigation-shell Specification

## Purpose

Define the premium authenticated mobile shell with splash bootstrap and a simplified three-tab information architecture.

**Domain layer**: presentation

## Requirements

### Requirement: Premium Navigation Shell

The system **MUST** present a splash-first mobile shell with exactly three primary tabs: `Stocks`, `Alerts`, and `Profile`. Each tab **MUST** render a real vector icon with active/inactive state clarity. The shell **MUST NOT** change auth guards or store contracts.

#### Scenario: Authenticated shell renders three tabs with icons

- **GIVEN** the user is authenticated
- **WHEN** the app leaves splash
- **THEN** the premium shell renders exactly three tabs: `Stocks`, `Alerts`, and `Profile`
- **AND** each tab displays a vector icon and label
- **AND** the active tab is visually distinct from inactive tabs

### Requirement: Nested Feature Stacks

The shell **MUST** route each primary area through nested stacks with dark-consistent native headers. Stocks, Alerts, and Profile/Settings **MUST** evolve without adding top-level IA bloat.

#### Scenario: Alerts and profile flows stay nested with styled headers

- **GIVEN** the user is in the authenticated shell
- **WHEN** they navigate to create alerts or notification settings
- **THEN** those routes are handled inside feature-specific nested stacks
- **AND** each nested screen renders a dark-themed native stack header

### Requirement: Real Tab Bar Icons

Each tab **MUST** render a vector icon from `@expo/vector-icons` (or equivalent bundled icon set). Unicode emoji or text fallback icons **MUST NOT** be used. Icons **MUST** reflect active/inactive state using theme tokens.

#### Scenario: Tabs render vector icons

- **GIVEN** the authenticated shell renders
- **WHEN** the bottom tab bar is visible
- **THEN** each tab (Stocks, Alerts, Profile) displays a distinct vector icon
- **AND** no Unicode emoji or text placeholder is used

#### Scenario: Active tab visual clarity

- **GIVEN** the user is on the Stocks tab
- **WHEN** the tab bar renders
- **THEN** the active tab icon and label use the primary/accent color token
- **AND** inactive tabs use the muted/secondary text token
- **AND** the active state is visually distinguishable at a glance

### Requirement: Dark-Consistent Stack Headers

Each nested stack screen **MUST** render a native stack header styled with the dark theme tokens. Headers **MUST** use consistent typography, background color, and back-button styling across all stacks.

#### Scenario: Header matches dark theme

- **GIVEN** the user navigates into a nested stack screen (e.g., StockChart, CreateAlert)
- **WHEN** the stack header renders
- **THEN** the header background uses the theme surface token
- **AND** the title uses the theme text-primary token
- **AND** the back arrow uses the theme accent or text token

#### Scenario: CreateAlert uses native header back

- **GIVEN** the user is on the CreateAlert screen
- **WHEN** the screen renders
- **THEN** the back navigation is provided by the native stack header
- **AND** no full-width custom back button is rendered in the screen body

### Requirement: Safe Area Correctness

The root screen container **MUST** wrap content in a `SafeAreaView` (or equivalent safe-area provider). Individual screens **MUST NOT** re-apply padding to compensate for missing safe-area insets.

#### Scenario: Content respects safe areas

- **GIVEN** the app renders on a device with notches or home indicators
- **WHEN** any screen is displayed
- **THEN** content is inset from device safe-area edges
- **AND** no content is clipped by the notch, status bar, or home indicator

#### Scenario: No padding override anti-pattern

- **GIVEN** ScreenContainer provides safe-area insets
- **WHEN** a screen renders inside ScreenContainer
- **THEN** the screen **MUST NOT** manually re-apply top/bottom padding to duplicate safe-area insets
