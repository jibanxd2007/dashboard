export default function OfflinePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Sahoda CRM — Offline</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
          }
          .container {
            max-width: 380px;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 1.5rem;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #f8fafc;
          }
          p {
            font-size: 0.875rem;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }
          button {
            background: #0d9488;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #0f766e;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">📡</div>
          <h1>You're Offline</h1>
          <p>
            Sahoda CRM needs an internet connection to work.
            Check your Wi-Fi or mobile data and try again.
          </p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
