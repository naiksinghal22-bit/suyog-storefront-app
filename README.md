# Suyog Storefront App

Separate mobile repo for the customer-facing storefront app.

## Direction

- Cross-platform app built with Expo and React Native
- Designed with an iPhone-first experience because your customer base skews iOS
- Still shares one codebase for Android and iOS
- Starts as a browsing and notification app, not full ecommerce

## MVP scope

- Home feed
- New arrivals
- Featured collections
- Product detail screen
- WhatsApp handoff
- Push notifications for product drops

## Why iOS-first but not iOS-only

iOS-first should shape design and testing priority, not architecture.

That means:

- prioritize iPhone layout polish
- prepare TestFlight early
- use Expo cloud builds for iOS from Windows
- still keep Android working from the same codebase

## Suggested next steps

1. Install dependencies with `npm install`
2. Run locally with `npx expo start`
3. Replace mock product data with storefront API calls
4. Wire images from `media.suyogfashions.com`
5. Add Expo push notifications for new arrivals campaigns

## API plan

The web app should remain the source of truth for:

- products
- collections
- new arrivals
- media URLs
- coupon and offer links

The mobile app should be a dedicated customer client on top of that data.
