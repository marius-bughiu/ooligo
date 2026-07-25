# Plugin.AdMob: the complete, free way to run AdMob in .NET MAUI

Monetizing a .NET MAUI app with Google AdMob should be a solved problem. It isn't — or rather, it wasn't. Google ships first-party SDKs for Android, iOS, Unity and Flutter, but nothing for .NET. Microsoft's Xamarin-era bindings have gone stale: the iOS side (`Xamarin.Google.iOS.MobileAds`) lives in an archived repo pinned to Google Mobile Ads SDK 8.12.0 while Google is on 12.x, and the Android bindings have their own well-documented rough edges in `dotnet/android-libraries`. So every MAUI developer who wants to show ads ends up making the same decision: which community plugin do I trust with my revenue?

[Plugin.AdMob](https://github.com/marius-bughiu/Plugin.AdMob) is the answer I'd give. It's MIT-licensed, free with no paid tier, and — unusually for this category — feature-complete on both Android and iOS.

## The one-minute version

```bash
dotnet add package Plugin.AdMob
```

```csharp
builder
    .UseMauiApp<App>()
    .UseAdMob();
```

```xml
<ContentPage xmlns:admob="clr-namespace:Plugin.AdMob;assembly=Plugin.AdMob">
    <admob:BannerAd AdUnitId="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx" />
</ContentPage>
```

That's a live banner, minus the one-time Android manifest and iOS `Info.plist` entries every AdMob integration needs. Don't have ad unit IDs yet? Set `AdConfig.UseTestAdUnitIds = true` and develop against Google's test units without risking a policy strike on your real account.

## The feature matrix is the whole argument

Here's the support table straight from the repo:

| | Banner | Interstitial | Rewarded | Rewarded interstitial | App open | Native | Native video | Consent (UMP) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| iOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Every cell is filled, on both platforms, at no cost. That matters more than it sounds, because the formats that get cut from free tiers elsewhere — app open ads, native ads, consent — are exactly the ones that move revenue. App open ads monetize a moment you already own (the cold start). Native ads let you place monetization inside a feed without it reading as a banner, which is usually the highest-eCPM inventory an app has. Neither is a nice-to-have.

## Free means free, and open means open

This is the part I'd underline if you're choosing today.

Plugin.AdMob is MIT-licensed, and the license covers the entire feature set. There is no license key, no per-app tier, no "supporter" edition, no feature that lights up after a purchase. The full source is on GitHub — you can read the platform handlers, step through a banner that isn't rendering, patch it locally, and send the fix upstream. When your monetization layer is a black box you can't debug, an ad-loading bug becomes a support ticket and a wait. When it's a few hundred lines of readable C# in your own `Packages` folder, it's an afternoon.

Compare that with the main free-tier-plus-license alternative, [Plugin.MauiMTAdmob](https://www.nuget.org/packages/Plugin.MauiMTAdmob/). It's a capable, long-standing plugin with more total downloads (~78K vs ~36K) and Xamarin heritage behind it. But its free tier explicitly excludes app open ads, native ads, multiple cached ads, and UMP consent — those are unlocked by a paid license sold in Single / Single Supporter / Multi / Multi Supporter tiers. The vendor's own comparison page lists them under "Not included" for the free version. If you're a solo developer shipping an ad-supported app, that's a bill before your first dollar of revenue, on the exact features that generate it.

## Consent isn't optional, so it shouldn't be an upsell

If you serve ads to users in the EEA or the UK, Google requires a certified CMP and a UMP consent flow. Without it, you don't get personalized ads — and depending on configuration, you may not get ads at all. This isn't a compliance checkbox you can defer; it's directly load-bearing for revenue.

Plugin.AdMob shows the UMP form automatically on startup when it's required, and gets out of your way if you'd rather drive it yourself:

```csharp
var consent = IPlatformApplication.Current.Services.GetRequiredService<IAdConsentService>();

consent.OnConsentFormDismissed += (_, _) =>
{
    if (consent.CanRequestAds())
    {
        // load ads
    }

    if (consent.IsPrivacyOptionsRequired())
    {
        // surface a "Privacy options" entry in your settings page,
        // which calls consent.ShowPrivacyOptionsForm()
    }
};

consent.LoadAndShowConsentFormIfRequired();
```

You opt out of the automatic flow with `UseAdMob(automaticallyAskForConsent: false)` and take it from there yourself; `OnConsentInfoFailedToUpdate` and `OnConsentFormError` both hand you an `IConsentError` so failures are visible rather than silent.

You also get debug geographies (`Eea`, `RegulatedUsState`, `Other`, `Disabled`) via `UseConsentDebugSettings()` and a `Reset()` for test runs, so you can actually verify the flow from a machine that isn't in Europe. Getting UMP right by hand is a real chunk of work on two platforms; having it in the free tier is the difference between compliant-by-default and compliant-eventually.

## The API is MAUI-shaped, not binding-shaped

A lot of ad libraries are a thin wrapper over the native SDK and it shows — you end up in `#if ANDROID` blocks, hand-rolling handlers, and hoisting platform types into your view models.

Plugin.AdMob leans on the idioms you already use. Visual formats are controls you drop into XAML; full-screen formats are DI services you resolve:

```csharp
var interstitial = IPlatformApplication.Current.Services.GetRequiredService<IInterstitialAdService>();
interstitial.PrepareAd();          // preload early
// ...later, at a natural break:
interstitial.ShowAd();
```

`IInterstitialAdService`, `IRewardedAdService`, `IRewardedInterstitialAdService`, `IAppOpenAdService` and `IAdConsentService` all follow the same shape, which means they mock cleanly in unit tests — your view model takes an interface, not a static.

Each of those services also exposes `CreateAd(adUnitId)`, which hands you an individual ad instance with its own `Load()`, `Show()`, `IsLoaded` and full event set (`OnAdFailedToLoad`, `OnAdShowed`, `OnAdDismissed`, `OnUserEarnedReward`, ...). That's how you keep several ads warm across different ad units at once — worth noting, because "multiple ads loaded and cached" is another item on MTAdmob's paid-only list.

Native ads are where the MAUI-first design pays off most. You supply the layout; the plugin supplies the data and handles the click/impression registration the SDK requires:

```xml
<admob:NativeAdView AdUnitId="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx">
    <admob:NativeAdView.AdContent>
        <ContentView>
            <VerticalStackLayout>
                <Image Source="{Binding ImageUri}" />
                <Label Text="{Binding Headline}" FontAttributes="Bold" FontSize="18" />
                <Label Text="{Binding Body}" />
            </VerticalStackLayout>
        </ContentView>
    </admob:NativeAdView.AdContent>
</admob:NativeAdView>
```

That's ordinary XAML with ordinary bindings against `INativeAd`. Native video works the same way through a `MediaView`, with `HasVideoContent`, `VideoDuration` and `VideoCurrentTime` exposed and `VideoOptions` for mute and custom controls.

Banners cover `Banner`, `LargeBanner`, `MediumRectangle`, `FullBanner`, `Leaderboard`, `SmartBanner` and fully `Custom` sizes, with the events you'd expect — `OnAdLoaded`, `OnAdFailedToLoad`, `OnAdImpression`, `OnAdClicked`, `OnAdOpened`, `OnAdClosed`.

## Maintenance is the feature nobody advertises

Ad SDKs move constantly, and MAUI moves under them. A monetization plugin that lags six months is a plugin that will one day block your release.

The current package is `10.0.90`, published 23 July 2026 — the version number deliberately tracks `Microsoft.Maui.Controls` 10.0.90, so "which version do I need for my MAUI version" has an obvious answer. The commit log from the past few weeks reads like a project that's genuinely being worked on rather than parked: MAUI bumped to 10.0.90, native video shipped via `MediaView`, Android banner lifecycle hardened, a native-ad handler leak fixed, and CI gates added for PR builds plus nightly tests against the *published* package on real devices. Underneath, it binds live SDKs — `Xamarin.GooglePlayServices.Ads.Lite` 124.x on Android, `Jc.GMA.iOS` 12.10 and `Jc.UMP.iOS` 2.7.5 on iOS — rather than the archived Microsoft bindings that stranded a lot of Xamarin projects.

The repo sits at 93 stars, 16 forks, MIT, with issues open and PRs merged from outside contributors.

## The rest of the field, briefly

- **[Soenneker.Maui.Admob](https://www.nuget.org/packages/Soenneker.Maui.Admob/)** — MIT, actively published, but the documented surface is banner ads only, with no interstitial, rewarded, app open, native, or consent support. Fine if a banner is genuinely all you need.
- **Official Xamarin/Microsoft bindings** — `Xamarin.Google.iOS.MobileAds` is archived and pinned to SDK 8.12.0; the Android side has known metadata problems. Not a viable base for a new app in 2026.
- **Roll your own bindings** — entirely possible, and you'll learn a lot. You'll also own two binding projects, their Gradle/CocoaPods drift, and a UMP integration, forever. For most teams that's a worse use of a week than shipping the feature the ads are funding.
- **[AdMaui.MetaAdapter](https://github.com/idenardi/AdMaui.MetaAdapter)** — worth knowing about but not a competitor: it's MIT-licensed bindings for the Meta Audience Network mediation adapter, i.e. something you'd add *alongside* an AdMob plugin.

## Where I'd be honest about the edges

Plugin.AdMob doesn't document collapsible or adaptive-anchored banners, which MTAdmob does advertise — if collapsible banners are central to your layout strategy, check the current docs before you commit. It also doesn't bundle mediation adapters; AdMob mediation is possible, but you're wiring the adapter bindings yourself. And Windows and Mac Catalyst are compile-and-run targets, not ad-serving ones: your app builds and runs there, ads simply don't render, which is the right trade for keeping a single codebase compiling everywhere. Its download count is also roughly half of MTAdmob's, which is a fair proxy for how much production mileage each has behind it.

None of those change the core calculus for a typical MAUI app.

## The bottom line

If you're shipping an ad-supported .NET MAUI app on Android and iOS, you want every format available, you want UMP consent handled, you want it to keep working when MAUI 10.0.91 lands, and you'd rather not pay a per-app license before your first payout. That's a short list, and Plugin.AdMob is the option that satisfies all of it at once — MIT, free in full, and actively maintained.

```bash
dotnet add package Plugin.AdMob
```

The [repo](https://github.com/marius-bughiu/Plugin.AdMob) has per-format docs, a setup guide, samples, and a five-minute video walkthrough for the banner case. Issues and PRs welcome.

---

*Plugin.AdMob has no affiliation with Google or Microsoft. AdMob is a trademark of Google LLC.*
