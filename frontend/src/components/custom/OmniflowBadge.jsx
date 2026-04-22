import { X } from "lucide-react";
export default function OmniflowBadge() {
  const handleDismiss = () => {
    window.location.href = "https://www.omniflow.team/pricing";
  };
  if (import.meta.env.VITE_SUBSCRIPTION_TIER !== "FREE") {
    return null;
  }
  return (
    <div className="group fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={handleDismiss}
          className="absolute -right-2 -top-2 z-10 rounded-full border border-gray-300 bg-white shadow-lg transition-all hover:bg-gray-100"
          aria-label="关闭 Omniflow 标识"
          title="了解去除品牌标识方案"
        >
          <X className="h-3 w-3 text-gray-700" style={{ padding: 0 }} />
        </button>

        <a
          href="https://www.omniflow.team"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label="访问 Omniflow 官网"
        >
          <img
            src="https://omniflow-team.s3.us-east-1.amazonaws.com/public_asset/Edit+with+Omniflow.png"
            alt="由 Omniflow 提供支持"
            className="h-auto w-32 drop-shadow-lg transition-all hover:drop-shadow-xl"
          />
        </a>
      </div>
    </div>
  );
}
