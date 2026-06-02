# mobile-design-system Specification

## Purpose

Provide the premium mobile presentation foundation: a dark-first theme system, the approved Designli token set, and reusable primitives for consistent fintech-grade UX.

**Domain layer**: presentation

## Requirements

### Requirement: Premium Theme Provider

The system **MUST** provide a React Context-based `ThemeProvider` that exposes `{ theme, toggleTheme, isDark, tokens }`. The provider **MUST** hydrate persisted mode before first interactive paint and **MUST** default to dark when no preference exists.

#### Scenario: Dark-first boot

- **GIVEN** the app launches for the first time
- **WHEN** the theme provider initializes
- **THEN** dark tokens render before the first interactive screen
- **AND** no light-first flash is visible

#### Scenario: Persisted mode is restored

- **GIVEN** the user previously stored a theme preference
- **WHEN** the app launches again
- **THEN** the stored mode is restored before descendant screens render

### Requirement: Premium Token System

The system **MUST** define premium tokens using the Designli navy/coral palette, supporting accent/semantic colors, Inter `400/500/600/700`, spacing `4/8/12/16/20/24/32/40/48`, radii `14/14/18/24/999`, and elevation levels used by cards, tabs, and chart surfaces.

#### Scenario: Token groups are available

- **GIVEN** a presentation component consumes `useTheme()`
- **WHEN** it reads tokens
- **THEN** it can access semantic `bg`, `text`, `border`, `brand`, `accent`, `semantic`, `chart`, `spacing`, `radius`, `typography`, and `elevation` groups

#### Scenario: Typography uses Inter

- **GIVEN** a component applies a typography role from tokens
- **WHEN** it renders text
- **THEN** the role uses the Inter family and the defined premium size hierarchy

### Requirement: Premium Primitives Library

The system **MUST** provide reusable premium primitives for shared presentation concerns, including `Button`, `Input`, `Card`, `Badge`, `Chip`, `Banner`, `OfflineBanner`, `FeedbackState`, `EmptyState`, `ScreenContainer`, `SectionHeader`, `StatTile`, `PriceHero`, and `ChartCard`. `ScreenContainer` **MUST** include `SafeAreaView`. `Banner` message text **MUST** use body-level typography. `Skeleton` **MUST** support responsive widths.

#### Scenario: Input status rendering

- **GIVEN** an input with helper or error text
- **WHEN** it receives focus or validation failure
- **THEN** focus styling uses the primary coral token
- **AND** helper or error copy remains legible on dark surfaces

#### Scenario: Shared feedback language

- **GIVEN** a screen needs offline, pending-sync, success, or retry feedback
- **WHEN** it renders shared primitives
- **THEN** the visual language is consistent across screens

#### Scenario: ScreenContainer provides safe-area insets

- **GIVEN** a screen wraps its content in `ScreenContainer`
- **WHEN** the screen renders on a device with notches or home indicators
- **THEN** content is automatically inset from all safe-area edges
- **AND** the screen does not need to apply manual padding for device insets

#### Scenario: Banner message uses body typography

- **GIVEN** a `Banner` component renders with a message string
- **WHEN** the banner is displayed
- **THEN** the message text uses body-level typography (not title or heading)
- **AND** the text remains legible on dark surfaces

#### Scenario: Skeleton supports responsive widths

- **GIVEN** a `Skeleton` component is used in a card or list layout
- **WHEN** the parent container width changes (e.g., device rotation, split view)
- **THEN** the skeleton width adapts to the available space
- **AND** no hardcoded pixel width causes overflow or underflow

### Requirement: Design System Test Coverage

The system **MUST** keep automated coverage for the theme provider and shared primitives, including dark-first hydration, token shape, component variants, shared feedback states, SafeAreaView integration in ScreenContainer, Banner body typography, and Skeleton responsive widths.

#### Scenario: Theme and component suites pass

- **GIVEN** the mobile workspace is set up
- **WHEN** the targeted theme and component suites run
- **THEN** the premium theme and primitive contracts pass without introducing new TypeScript errors in changed files
- **AND** ScreenContainer renders within safe-area bounds in test
- **AND** Skeleton adapts width in test
- **AND** Banner message renders at body typography size in test
