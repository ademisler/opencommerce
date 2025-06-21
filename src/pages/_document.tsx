import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="icon"
          href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJz4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0nZycgeDE9JzAlJyB5MT0nMCUnIHgyPScxMDAlJyB5Mj0nMTAwJSc+CiAgICAgIDxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyNiZTE4NWQnLz4KICAgICAgPHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjZjk3MzE2Jy8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSc1MCcgY3k9JzUwJyByPSc1MCcgZmlsbD0ndXJsKCNnKScvPgogIDx0ZXh0IHg9JzUwJyB5PSc3MCcgdGV4dC1hbmNob3I9J21pZGRsZScgZm9udC1zaXplPSc3MCcgZm9udC1mYW1pbHk9J0FyaWFsJyBmb250LXdlaWdodD0nYm9sZCcgZmlsbD0nd2hpdGUnPkY8L3RleHQ+Cjwvc3ZnPgo="
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
