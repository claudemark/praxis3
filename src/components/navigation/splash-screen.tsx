export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-surface-50 via-primary-50/40 to-surface-100">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <svg
          viewBox="0 0 48 48"
          className="size-12 text-primary-foreground"
          role="presentation"
          aria-hidden
        >
          <path
            d="M23.8 6c-3.1 0-5.9 1.3-7.9 3.3l-9.6 9.5c-1 1-1 2.6 0 3.6l6 5.9c1 1 2.6 1 3.6 0l7.9-7.8c1.4-1.4 3.6-1.4 5 0l3.6 3.6c1.4 1.4 1.4 3.6 0 5l-7.6 7.5c-1 1-1 2.6 0 3.6l4.4 4.3c1 1 2.6 1 3.6 0l9.8-9.7C41.7 33 43 30.2 43 27s-1.3-5.9-3.3-7.9l-8.7-8.7C28.7 7.3 26 6 23.8 6z"
            className="fill-current"
          />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-foreground/80">PraxisPro Manager</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Das integrierte klinische, administrative und finanzielle Betriebssystem für moderne
          orthopädische Praxen.
        </p>
      </div>
      <span className="h-1 w-48 overflow-hidden rounded-full bg-surface-200">
        <span className="block h-full w-1/2 animate-[pulse_1.6s_ease-in-out_infinite] bg-primary" />
      </span>
    </div>
  );
}
