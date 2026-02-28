import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* Full-screen PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NOSH" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FBF8F4" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            height: 100%;
            height: 100dvh;
            margin: 0;
            padding: 0;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
            background-color: #FBF8F4;
          }
          body {
            overflow: hidden;
          }
          #root {
            display: flex;
            height: 100%;
            height: 100dvh;
            flex: 1;
          }
          @supports (padding: env(safe-area-inset-top)) {
            body {
              padding-top: env(safe-area-inset-top);
              padding-bottom: env(safe-area-inset-bottom);
              padding-left: env(safe-area-inset-left);
              padding-right: env(safe-area-inset-right);
            }
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
