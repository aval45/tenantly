# Mobile Application Overrides

These rules translate `ui-ux-pro-max` recommendations into native mobile behavior and override web/landing-page guidance in `../MASTER.md`.

## Layout

- Use a single-column handset layout with 20–24 px horizontal padding.
- Use flat sections and inset dividers before introducing a card.
- Keep operational screens information-led. Use property imagery only where the image itself is functional, such as a property detail or gallery—not as required dashboard decoration.
- Keep primary navigation to four destinations per role.
- Adapt to tablets and foldables with list-detail panes rather than stretching the handset column.

## Components

- Use HeroUI Native with the Tenantly token theme.
- Use Inter and Lucide consistently.
- Minimum touch target is 44 pt on iOS and 48 dp on Android, with at least 8 px between adjacent targets.
- Use skeletons for loading and actionable empty states instead of blank screens.
- Use the correct mobile keyboard and autofill metadata for every input.
- Use explicit confirmation for financial and destructive actions.

## Visual constraints

- Light mode is the default.
- References to Airbnb or other contemporary apps set the quality bar only; do not copy their imagery, layout, navigation, branding, or content strategy.
- Do not expose Material or Cupertino styling in branded content.
- Do not use gradients, glass cards, emoji icons, generic stock images, or heavy shadows.
- Use the accent color sparingly for the primary action, selection, focus, and critical highlights.
- Use 150–200 ms transitions and respect reduced-motion settings.

## Navigation

- Use Expo Router with custom branded tabs.
- Android preserves predictive back and gesture navigation.
- iOS may use Liquid Glass only for navigation chrome on supported devices.
