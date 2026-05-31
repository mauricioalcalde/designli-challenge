# mobile-navigation Specification

**Layer**: presentation

## Purpose

Navigation shell: auth-aware stack/tab switching, connectivity awareness on auth screen.

## Requirements

### R1: Auth-Aware Shell

The system MUST render a NavigationContainer wrapping either AuthStack or MainTabs based on `isAuthenticated`.

| #   | GIVEN                                 | WHEN                 | THEN                                         |
| --- | ------------------------------------- | -------------------- | -------------------------------------------- |
| 1.1 | `isAuthenticated` is false            | the app renders      | AuthStack MUST be active (Login screen only) |
| 1.2 | `isAuthenticated` is true             | the app renders      | MainTabs MUST be active                      |
| 1.3 | auth state changes from false to true | the shell re-renders | it MUST animate from stack to tabs           |

### R2: Auth Stack

The AuthStack MUST contain exactly one screen: Login.

| #   | GIVEN               | WHEN                           | THEN                                  |
| --- | ------------------- | ------------------------------ | ------------------------------------- |
| 2.1 | AuthStack is active | rendered                       | ONLY the Login screen is in the stack |
| 2.2 | login succeeds      | `isAuthenticated` becomes true | the stack MUST transition to MainTabs |

### R3: Tab Skeleton

The MainTabs MUST contain three placeholder tabs: Stocks, Alerts, and Settings.

| #   | GIVEN                   | WHEN                     | THEN                                                    |
| --- | ----------------------- | ------------------------ | ------------------------------------------------------- |
| 3.1 | MainTabs is active      | rendered                 | exactly three tabs MUST appear with placeholder content |
| 3.2 | any tab is tapped       | it has no real content   | a placeholder message MUST be displayed                 |
| 3.3 | the user navigates back | no authentication exists | tabs MUST NOT be accessible                             |

### R4: Connectivity Banner

The system MUST use NetInfo to detect connectivity and display a non-dismissible banner on the auth screen when offline.

| #   | GIVEN                           | WHEN                      | THEN                                                   |
| --- | ------------------------------- | ------------------------- | ------------------------------------------------------ |
| 4.1 | the device is offline           | the auth screen is active | a persistent banner MUST read "No internet connection" |
| 4.2 | the device regains connectivity | the banner is visible     | it MUST auto-dismiss                                   |
| 4.3 | the device is offline           | the user taps login       | a NetworkError MUST be displayed                       |

### R5: Test Expectations

| #   | Test                                   | Expected                                      |
| --- | -------------------------------------- | --------------------------------------------- |
| 5.1 | auth state false renders AuthStack     | Login screen is visible, tabs are not         |
| 5.2 | auth state true renders MainTabs       | Tab bar with 3 items is visible, Login is not |
| 5.3 | offline banner shown when disconnected | "No internet connection" banner renders       |
| 5.4 | offline banner dismissed on reconnect  | banner disappears on connectivity change      |
