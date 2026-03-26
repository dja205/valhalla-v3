interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="bg-danger/10 border border-danger rounded-lg p-4 text-danger">
      <div className="flex items-center gap-2">
        <span className="text-xl">⚠️</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
