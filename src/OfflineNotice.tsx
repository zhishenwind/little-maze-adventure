import { useSyncExternalStore } from "react";
import { Check, Download, Info, RefreshCw, WifiOff } from "lucide-react";
import {
  applyOfflineUpdate,
  getOfflineState,
  retryOffline,
  subscribeOffline,
} from "./offline";

export default function OfflineNotice() {
  const state = useSyncExternalStore(subscribeOffline, getOfflineState);
  const ready = state.stage === "ready";
  const Icon = ready
    ? state.online
      ? Check
      : WifiOff
    : state.stage === "preparing"
      ? Download
      : Info;
  const label = ready
    ? state.online
      ? "离线可用"
      : "正在离线游玩"
    : state.stage === "preparing"
      ? "正在保存离线游戏"
      : state.stage === "error"
        ? "离线游戏尚未保存完成"
        : "当前为在线体验";
  const detail = ready
    ? "游戏已保存在这台设备，断网也能继续探索。"
    : state.stage === "preparing"
      ? "第一次准备好以后，下次就能直接玩啦。"
      : state.stage === "unsupported"
        ? "请使用 HTTPS 或 localhost 地址，开启离线保存。"
        : state.stage === "development"
          ? "离线体验请打开构建预览地址；此处保留实时开发预览。"
          : state.online
            ? "可以先玩，也可以重新保存，准备下次的离线冒险。"
            : "联网后再保存一次，就能开启离线冒险。";
  return (
    <div className="offline-panel">
      <div
        className={`offline-notice offline-${state.stage}`}
        role="status"
        data-testid="offline-status"
        data-stage={state.stage}
      >
        <Icon size={17} />
        <div>
          <strong>{label}</strong>
          <span>{detail}</span>
        </div>
        {state.stage === "error" && (
          <button
            onClick={() => {
              void retryOffline();
            }}
            disabled={!state.online}
          >
            <RefreshCw size={14} />
            重试保存
          </button>
        )}
      </div>
      {state.updateAvailable && (
        <div className="offline-update" role="status">
          <RefreshCw size={17} />
          <div>
            <strong>
              {state.updateFailed
                ? "更新未完成，可以再试一次"
                : "新的冒险已准备好"}
            </strong>
            <span>更新会重新开始本局，收集的星星会保留。</span>
          </div>
          <button onClick={applyOfflineUpdate} disabled={state.updating}>
            {state.updating ? "正在更新…" : "更新并重新打开"}
          </button>
        </div>
      )}
    </div>
  );
}
