# Notifications Plan

This app is set up so the native notification capability only needs one new EAS iOS build.

After that build, most future notification work can be changed without another native build:

- notification copy
- campaigns and schedules
- audience selection
- deep-link destination data
- restock/new-arrival logic
- app-side JS behavior through OTA updates

## Current app support

- permission request inside `app/notifications.tsx`
- Expo push token generation
- test local notification
- tap-to-open routing using Expo Router

## Recommended payload shape

Send notification data with a `url` field that maps to an in-app route.

Examples:

```json
{
  "title": "New Arrivals",
  "body": "Fresh festive looks are live now.",
  "data": {
    "url": "/browse/new-arrivals?kind=collection&title=New%20Arrivals"
  }
}
```

```json
{
  "title": "Back in stock",
  "body": "Your size is available again.",
  "data": {
    "url": "/product/chanderi-set"
  }
}
```

## Admin/backend responsibilities

The admin interface can later manage:

- message title and body
- audience selection
- schedule vs send now
- product or collection deep link
- send history

The backend should eventually provide:

- device token storage
- optional user preference storage such as size/category interest
- send/log APIs
- campaign delivery history
