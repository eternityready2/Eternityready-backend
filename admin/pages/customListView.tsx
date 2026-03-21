import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PageContainer,
  CellLink,
  CellContainer,
} from "@keystone-6/core/admin-ui/components";
import { Heading, Box, Link } from "@keystone-ui/core";
import { Pill } from "@keystone-ui/pill";
import { Checkbox, TextInput } from "@keystone-ui/fields";
import { ChevronDownIcon } from "@keystone-ui/icons/icons/ChevronDownIcon";
import { ChevronLeftIcon } from "@keystone-ui/icons/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@keystone-ui/icons/icons/ChevronRightIcon";
import { XIcon } from "@keystone-ui/icons/icons/XIcon";
import { LockIcon } from "@keystone-ui/icons/icons/LockIcon";
import { Trash2Icon } from "@keystone-ui/icons/icons/Trash2Icon";
import { AlertTriangleIcon } from "@keystone-ui/icons/icons/AlertTriangleIcon";
import { SlashIcon } from "@keystone-ui/icons/icons/SlashIcon";
import { Tooltip } from "@keystone-ui/tooltip";
import { z } from "zod";

const PAGE_SIZE = 50;

const ALL_STATUSES = [
  "public",
  "private",
  "deleted",
  "geo_restricted",
  "age_restricted",
  "not_embeddable",
  "unknown",
] as const;

type VideoStatus = (typeof ALL_STATUSES)[number];

const STATUS_LABELS: Record<VideoStatus, string> = {
  public: "Public",
  private: "Private",
  deleted: "Deleted",
  geo_restricted: "Geo-restricted",
  age_restricted: "Age-restricted",
  not_embeddable: "Not embeddable",
  unknown: "Unknown",
};

const statusColors: Record<VideoStatus, string> = {
  public: "#22c55e",
  private: "#a855f7",
  deleted: "#ef4444",
  geo_restricted: "#f97316",
  age_restricted: "#eab308",
  not_embeddable: "#6366f1",
  unknown: "#9ca3af",
};

type LogEntry = {
  title: string;
  videoStatus: VideoStatus;
  message: string;
  timestamp: string;
};

// ─── Status Log Modal ───────────────────────────────────────────────

const StatusLogModal = ({
  logs,
  isOpen,
  isRunning,
  checked,
  total,
  onClose,
  onCancel,
}: {
  logs: LogEntry[];
  isOpen: boolean;
  isRunning: boolean;
  checked: number;
  total: number;
  onClose: () => void;
  onCancel: () => void;
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  if (!isOpen) return null;

  const summary = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = logs.filter((l) => l.videoStatus === s).length;
      return acc;
    },
    {} as Record<VideoStatus, number>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRunning) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "640px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Status Check Log
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              {isRunning
                ? `Checking ${checked} of ${total}...`
                : checked < total
                  ? `Cancelled — ${checked} of ${total} checked`
                  : `Done — ${checked} of ${total} checked`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isRunning && (
              <button
                onClick={onCancel}
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: "1px solid #fca5a5",
                  background: "#fef2f2",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isRunning}
              style={{
                background: "none",
                border: "none",
                cursor: isRunning ? "not-allowed" : "pointer",
                color: isRunning ? "#d1d5db" : "#6b7280",
                padding: "4px",
              }}
            >
              <XIcon size="small" />
            </button>
          </div>
        </div>

        <div style={{ height: "3px", background: "#f3f4f6" }}>
          <div
            style={{
              height: "100%",
              width: total > 0 ? `${(checked / total) * 100}%` : "0%",
              background: isRunning ? "#2563eb" : "#22c55e",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 20px",
            maxHeight: "60vh",
          }}
        >
          {logs.length === 0 && (
            <p
              style={{
                color: "#9ca3af",
                textAlign: "center",
                padding: "24px",
              }}
            >
              Starting checks...
            </p>
          )}
          {logs.map((log, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "8px 0",
                borderBottom:
                  i < logs.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  marginTop: "5px",
                  flexShrink: 0,
                  background: statusColors[log.videoStatus] || "#9ca3af",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {log.title}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  {log.message}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#9ca3af",
                  whiteSpace: "nowrap",
                  marginTop: "3px",
                }}
              >
                {log.timestamp}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {!isRunning && logs.length > 0 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            <span>
              {ALL_STATUSES.filter((s) => summary[s] > 0)
                .map((s) => `${summary[s]} ${STATUS_LABELS[s].toLowerCase()}`)
                .join(", ")}
            </span>
            <button
              onClick={onClose}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Zod / Types ────────────────────────────────────────────────────

const verifyVideosSchema = z.array(
  z.object({
    id: z.string(),
    sourceType: z.enum(["youtube", "embed", "upload"]),
    videoId: z.string().nullable(),
    embedCode: z.string().nullable().optional(),
  })
);

type Origin = "on-demand" | "music" | "channels" | "movies" | "radio";

const ORIGIN_LABELS: Record<Origin, string> = {
  "on-demand": "On-demand",
  music: "Music",
  channels: "Channels",
  movies: "Movies",
  radio: "Radio",
};

type VideoItem = {
  id: string;
  title: string;
  author: string | null;
  sourceType: "youtube" | "embed" | "upload";
  videoId: string | null;
  embedCode: string | null;
  origin: Origin;
  thumbnail: { url: string } | null;
  isPublic: boolean;
  isRestricted: boolean;
  videoStatus: VideoStatus;
};

type VerificationStatus = {
  isPublic: boolean;
  isRestricted: boolean;
  videoStatus: VideoStatus;
  message: string;
};

const sourceTypeTones: Record<string, string> = {
  youtube: "red",
  upload: "blue",
  embed: "gray",
};

// ─── Status Circle ──────────────────────────────────────────────────

function getDefaultMessage(status: VideoStatus): string {
  switch (status) {
    case "public":
      return "Video is public and available";
    case "private":
      return "Video is private on YouTube";
    case "deleted":
      return "Video was deleted from YouTube";
    case "geo_restricted":
      return "Video is geo-restricted in the USA";
    case "age_restricted":
      return "Video is age-restricted on YouTube";
    case "not_embeddable":
      return "Video has embedding disabled";
    default:
      return "Status unknown — click to check";
  }
}

const StatusCircle = ({
  video,
  verificationStatus,
  onCheck,
  disabled,
}: {
  video: VideoItem;
  verificationStatus?: VerificationStatus;
  onCheck: () => void;
  disabled: boolean;
}) => {
  const status =
    verificationStatus?.videoStatus ?? video.videoStatus ?? "unknown";
  const message = verificationStatus?.message ?? getDefaultMessage(status);

  const baseCircle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "inline-block",
    cursor: disabled ? "wait" : "pointer",
    marginTop: "5px",
  };

  let content: React.ReactNode;

  switch (status) {
    case "public":
      content = <div style={{ ...baseCircle, background: "#22c55e" }} />;
      break;
    case "private":
      content = <LockIcon size="small" color="#a855f7" />;
      break;
    case "deleted":
      content = <Trash2Icon size="small" color="#ef4444" />;
      break;
    case "geo_restricted":
      content = (
        <div
          style={{
            ...baseCircle,
            background: "conic-gradient(#ef4444 0 50%, #22c55e 50% 100%)",
          }}
        />
      );
      break;
    case "age_restricted":
      content = <AlertTriangleIcon size="small" color="#eab308" />;
      break;
    case "not_embeddable":
      content = <SlashIcon size="small" color="#6366f1" />;
      break;
    default:
      content = <div style={{ ...baseCircle, background: "#9ca3af" }} />;
      break;
  }

  return (
    <Tooltip content={<span>{message} — click to check</span>}>
      {(props) => (
        <span
          {...props}
          onClick={() => {
            if (!disabled) onCheck();
          }}
          style={{ cursor: disabled ? "wait" : "pointer" }}
        >
          {content}
        </span>
      )}
    </Tooltip>
  );
};

// ─── Main Component ─────────────────────────────────────────────────

export default function PaginaListaVideosCustomizada() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteHover, setIsDeleteHover] = useState(false);
  const [isStatusHover, setIsStatusHover] = useState(false);
  const [isCheckAllHover, setIsCheckAllHover] = useState(false);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const [verificationStatus, setVerificationStatus] = useState<
    Record<string, VerificationStatus>
  >({});
  const [isVerifying, setIsVerifying] = useState(false);
  const cancelRef = useRef(false);

  // Log modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [checkTotal, setCheckTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters
  const [filterSourceType, setFilterSourceType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");

  // Close filters on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    if (filtersOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [filtersOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [filterSourceType, filterStatus, filterOrigin]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);

    const conditions: any[] = [];
    if (debouncedSearch) {
      conditions.push({ title: { contains: debouncedSearch } });
    }
    if (filterSourceType !== "all") {
      conditions.push({ sourceType: { equals: filterSourceType } });
    }
    if (filterStatus !== "all") {
      conditions.push({ videoStatus: { equals: filterStatus } });
    }
    if (filterOrigin !== "all") {
      conditions.push({ origin: { equals: filterOrigin } });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const query = `
      query Videos($where: VideoWhereInput!, $take: Int!, $skip: Int!) {
        videos(
          where: $where,
          orderBy: { createdAt: desc },
          take: $take,
          skip: $skip
        ) {
          id
          title
          author
          sourceType
          videoId
          embedCode
          origin
          thumbnail { url }
          isPublic
          isRestricted
          videoStatus
        }
        videosCount(where: $where)
      }
    `;

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { where, take: PAGE_SIZE, skip: currentPage * PAGE_SIZE },
        }),
      });
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors.map((e: any) => e.message).join("\n"));
      }
      setVideos(json.data.videos);
      setTotalCount(json.data.videosCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterSourceType, filterStatus, filterOrigin]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ─── Selection ──────────────────────────────────────────────────

  const toggleSelection = (videoId: string) => {
    setSelectedVideos((curr) =>
      curr.includes(videoId)
        ? curr.filter((id) => id !== videoId)
        : [...curr, videoId]
    );
  };

  const toggleSelectAll = () => {
    const pageIds = videos.map((v) => v.id);
    const allSelected = pageIds.every((id) => selectedVideos.includes(id));
    if (allSelected && pageIds.length > 0) {
      setSelectedVideos((curr) => curr.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedVideos((curr) => [...new Set([...curr, ...pageIds])]);
    }
  };

  const allPageSelected =
    videos.length > 0 && videos.every((v) => selectedVideos.includes(v.id));
  const somePageSelected =
    videos.some((v) => selectedVideos.includes(v.id)) && !allPageSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  // ─── Actions ────────────────────────────────────────────────────

  async function deleteVideo() {
    const userConfirmed = window.confirm(
      `Are you sure you want to delete ${selectedVideos.length} video(s)? This action cannot be undone.`
    );
    if (!userConfirmed) return;

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation DeleteVideos($where: [VideoWhereUniqueInput!]!) { deleteVideos(where: $where) { id } }`,
          variables: { where: selectedVideos.map((id) => ({ id })) },
        }),
      });
      const json = await res.json();
      if (json.errors)
        throw new Error(json.errors.map((e: any) => e.message).join("\n"));

      setSelectedVideos([]);
      await fetchVideos();
    } catch (err: any) {
      setError(`Failed to delete videos: ${err.message}`);
    }
  }

  // Shared verify logic — accepts an array of VideoItems
  async function runStatusCheck(items: VideoItem[]) {
    if (items.length === 0) return;

    cancelRef.current = false;
    setIsVerifying(true);
    setLogEntries([]);
    setCheckedCount(0);
    setCheckTotal(items.length);
    setLogModalOpen(true);

    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) break;
      const video = items[i];
      const now = new Date().toLocaleTimeString();

      try {
        const payload = [
          {
            id: video.id,
            sourceType: video.sourceType,
            videoId: video.videoId,
            embedCode: video.embedCode,
          },
        ];
        const validPayload = verifyVideosSchema.parse(payload);

        const res = await fetch("/api/verifyVideo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videos: validPayload }),
        });
        const data = await res.json();

        if (data.results && data.results[video.id]) {
          const result = data.results[video.id];

          setVerificationStatus((prev) => ({ ...prev, [video.id]: result }));
          setVideos((curr) =>
            curr.map((v) =>
              v.id === video.id
                ? {
                    ...v,
                    isPublic: result.isPublic,
                    isRestricted: result.isRestricted,
                    videoStatus: result.videoStatus,
                  }
                : v
            )
          );
          setLogEntries((prev) => [
            ...prev,
            {
              title: video.title,
              videoStatus: result.videoStatus,
              message: result.message,
              timestamp: now,
            },
          ]);
        } else {
          setLogEntries((prev) => [
            ...prev,
            {
              title: video.title,
              videoStatus: "unknown",
              message: "Unexpected response from server",
              timestamp: now,
            },
          ]);
        }
      } catch (err) {
        setLogEntries((prev) => [
          ...prev,
          {
            title: video.title,
            videoStatus: "unknown",
            message: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
            timestamp: now,
          },
        ]);
      }

      setCheckedCount(i + 1);
    }

    setIsVerifying(false);
  }

  function verifySelected() {
    if (selectedVideos.length === 0) {
      alert("Select at least one video to check.");
      return;
    }
    const items = videos.filter((v) => selectedVideos.includes(v.id));
    runStatusCheck(items);
  }

  async function checkAllVideos() {
    // Fetch ALL video IDs matching current filters (not just current page)
    const conditions: any[] = [];
    if (debouncedSearch) {
      conditions.push({ title: { contains: debouncedSearch } });
    }
    if (filterSourceType !== "all") {
      conditions.push({ sourceType: { equals: filterSourceType } });
    }
    if (filterStatus !== "all") {
      conditions.push({ videoStatus: { equals: filterStatus } });
    }
    if (filterOrigin !== "all") {
      conditions.push({ origin: { equals: filterOrigin } });
    }
    const where = conditions.length > 0 ? { AND: conditions } : {};

    const userConfirmed = window.confirm(
      `This will check ALL ${totalCount} videos matching your current filters. This may take a while and use YouTube API quota. Continue?`
    );
    if (!userConfirmed) return;

    cancelRef.current = false;
    setIsVerifying(true);
    setLogEntries([]);
    setCheckedCount(0);
    setCheckTotal(totalCount);
    setLogModalOpen(true);

    // Fetch in pages and check each video
    let checked = 0;
    for (let skip = 0; skip < totalCount; skip += PAGE_SIZE) {
      if (cancelRef.current) break;
      try {
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query Videos($where: VideoWhereInput!, $take: Int!, $skip: Int!) {
                videos(where: $where, orderBy: { createdAt: desc }, take: $take, skip: $skip) {
                  id title sourceType videoId embedCode
                }
              }
            `,
            variables: { where, take: PAGE_SIZE, skip },
          }),
        });
        const json = await res.json();
        if (json.errors) throw new Error(json.errors.map((e: any) => e.message).join("\n"));

        const batch: VideoItem[] = json.data.videos;

        for (const video of batch) {
          if (cancelRef.current) break;
          const now = new Date().toLocaleTimeString();
          try {
            const payload = verifyVideosSchema.parse([
              {
                id: video.id,
                sourceType: video.sourceType,
                videoId: video.videoId,
                embedCode: video.embedCode,
              },
            ]);

            const verifyRes = await fetch("/api/verifyVideo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videos: payload }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.results && verifyData.results[video.id]) {
              const result = verifyData.results[video.id];

              setVerificationStatus((prev) => ({
                ...prev,
                [video.id]: result,
              }));
              // Update if video is on current page
              setVideos((curr) =>
                curr.map((v) =>
                  v.id === video.id
                    ? {
                        ...v,
                        isPublic: result.isPublic,
                        isRestricted: result.isRestricted,
                        videoStatus: result.videoStatus,
                      }
                    : v
                )
              );
              setLogEntries((prev) => [
                ...prev,
                {
                  title: video.title,
                  videoStatus: result.videoStatus,
                  message: result.message,
                  timestamp: now,
                },
              ]);
            } else {
              setLogEntries((prev) => [
                ...prev,
                {
                  title: video.title,
                  videoStatus: "unknown",
                  message: "Unexpected response",
                  timestamp: now,
                },
              ]);
            }
          } catch (err) {
            setLogEntries((prev) => [
              ...prev,
              {
                title: video.title,
                videoStatus: "unknown",
                message: `Error: ${err instanceof Error ? err.message : "Failed"}`,
                timestamp: now,
              },
            ]);
          }
          checked++;
          setCheckedCount(checked);
        }
      } catch (err) {
        console.error("Failed to fetch batch:", err);
        break;
      }
    }

    setIsVerifying(false);
  }

  function checkSingleVideo(video: VideoItem) {
    if (isVerifying) return;
    runStatusCheck([video]);
  }

  // ─── Button style helper ──────────────────────────────────────────

  const pillBtn = (
    bg: string,
    bgHover: string,
    color: string,
    colorHover: string,
    hover: boolean
  ): React.CSSProperties => ({
    backgroundColor: hover ? bgHover : bg,
    color: hover ? colorHover : color,
    borderRadius: "6px",
    border: "solid 1px transparent",
    fontSize: "1rem",
    fontWeight: "500",
    height: "38px",
    padding: "0 16px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  });

  const gridLayout = "40px 60px 2fr 1fr 1fr 80px";

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <PageContainer header={<Heading type="h3">Videos</Heading>}>
      {/* Toolbar */}
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          paddingBottom: "var(--ks-space-large)",
          borderBottom: "1px solid var(--ks-color-border)",
          marginBottom: "var(--ks-space-large)",
          marginTop: "2rem",
        }}
      >
        <Box
          as="form"
          onSubmit={(e) => e.preventDefault()}
          style={{ flex: 1 }}
        >
          <TextInput
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        <Link href="/videos/create">
          <button
            style={{
              whiteSpace: "nowrap",
              backgroundColor: "#2563eb",
              color: "#fff",
              fontSize: "0.875rem",
              height: "32px",
              padding: "0 12px",
              fontWeight: "500",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </Link>

        {/* Filters */}
        <div ref={filtersRef} style={{ position: "relative" }}>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              backgroundColor:
                filterSourceType !== "all" || filterStatus !== "all" || filterOrigin !== "all"
                  ? "#dbeafe"
                  : "#eff6ff",
              color: "#2563eb",
              fontSize: "1rem",
              fontWeight: "500",
              height: "38px",
              padding: "0 16px",
              borderRadius: "6px",
              cursor: "pointer",
              border: "none",
            }}
          >
            Filters
            {(filterSourceType !== "all" || filterStatus !== "all" || filterOrigin !== "all") && " *"}
            <ChevronDownIcon size="small" style={{ marginLeft: "8px" }} />
          </button>

          {filtersOpen && (
            <div
              style={{
                position: "absolute",
                top: "44px",
                right: 0,
                zIndex: 100,
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                padding: "16px",
                minWidth: "260px",
              }}
            >
              <Heading type="h5" marginBottom="medium">
                Source Type
              </Heading>
              <select
                value={filterSourceType}
                onChange={(e) => setFilterSourceType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="all">All sources</option>
                <option value="youtube">YouTube</option>
                <option value="embed">Embed</option>
                <option value="upload">Upload</option>
              </select>

              <Heading type="h5" marginBottom="medium">
                Video Status
              </Heading>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  marginBottom: "12px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="all">All statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>

              <Heading type="h5" marginBottom="medium">
                Origin
              </Heading>
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  marginBottom: "12px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="all">All origins</option>
                {(Object.keys(ORIGIN_LABELS) as Origin[]).map((o) => (
                  <option key={o} value={o}>
                    {ORIGIN_LABELS[o]}
                  </option>
                ))}
              </select>

              {(filterSourceType !== "all" || filterStatus !== "all" || filterOrigin !== "all") && (
                <button
                  onClick={() => {
                    setFilterSourceType("all");
                    setFilterStatus("all");
                    setFilterOrigin("all");
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </Box>

      {/* Info bar + action buttons */}
      <Box
        paddingBottom="small"
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <text>
          {selectedVideos.length > 0 ? (
            <>
              Selected{" "}
              <strong>
                {selectedVideos.length} of {totalCount}
              </strong>
            </>
          ) : (
            <>
              Showing{" "}
              <strong>
                {totalCount > 0 ? currentPage * PAGE_SIZE + 1 : 0}–
                {Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of{" "}
                {totalCount}
              </strong>{" "}
              Videos
            </>
          )}
        </text>

        {/* Check All button — always visible */}
        <button
          style={pillBtn(
            "#f0fdf4",
            "#dcfce7",
            "#16a34a",
            "#15803d",
            isCheckAllHover
          )}
          onMouseEnter={() => setIsCheckAllHover(true)}
          onMouseLeave={() => setIsCheckAllHover(false)}
          disabled={isVerifying || totalCount === 0}
          onClick={() => {
            void checkAllVideos();
          }}
        >
          {isVerifying ? "Checking..." : `Check All (${totalCount})`}
        </button>

        {selectedVideos.length > 0 && (
          <>
            <button
              style={pillBtn(
                "#fef2f2",
                "#fee2e2",
                "#dc2626",
                "#b91c1c",
                isDeleteHover
              )}
              onMouseEnter={() => setIsDeleteHover(true)}
              onMouseLeave={() => setIsDeleteHover(false)}
              onClick={() => {
                void deleteVideo();
              }}
            >
              Delete
            </button>
            <button
              style={pillBtn(
                "#eff6ff",
                "#d5e7fd",
                "#2563eb",
                "#1e50bb",
                isStatusHover
              )}
              onMouseEnter={() => setIsStatusHover(true)}
              onMouseLeave={() => setIsStatusHover(false)}
              disabled={isVerifying}
              onClick={() => {
                void verifySelected();
              }}
            >
              {isVerifying ? "Checking..." : "Status"}
            </button>
          </>
        )}
      </Box>

      {/* Table header */}
      <Box
        style={{
          borderBottom: "1px solid var(--ks-color-border)",
          display: "grid",
          gridTemplateColumns: gridLayout,
          gap: "var(--ks-space-medium)",
          borderBottomWidth: "2px",
          borderColor: "#e1e5e9",
          borderStyle: "solid",
          fontWeight: "500",
          textAlign: "left",
          color: "#6b7280",
          whiteSpace: "nowrap",
          alignItems: "center",
        }}
      >
        <Checkbox
          checked={allPageSelected}
          ref={selectAllCheckboxRef}
          style={{
            appearance: somePageSelected ? "auto" : undefined,
            content: '""',
            display: "block",
            width: "0px",
            marginRight: "8px",
            backgroundColor: "var(--ks-color-foreground)",
          }}
          onChange={toggleSelectAll}
          children={undefined}
        />
        <CellContainer>Thumb</CellContainer>
        <CellContainer>Title</CellContainer>
        <CellContainer>Author/Channel</CellContainer>
        <CellContainer>Origin</CellContainer>
        <CellContainer>Status</CellContainer>
      </Box>

      {/* Table rows */}
      {videos.map((video) => (
        <Box
          key={video.id}
          style={{
            borderBottom: "1px solid var(--ks-color-border)",
            display: "grid",
            gridTemplateColumns: gridLayout,
            gap: "var(--ks-space-medium)",
            alignItems: "center",
            backgroundColor: selectedVideos.includes(video.id)
              ? "var(--ks-color-background-selected)"
              : "transparent",
          }}
        >
          <CellContainer>
            <Checkbox
              checked={selectedVideos.includes(video.id)}
              onChange={() => toggleSelection(video.id)}
              children={undefined}
            />
          </CellContainer>
          <CellContainer>
            {video.thumbnail?.url ? (
              <img
                src={video.thumbnail.url}
                alt={`Thumbnail for ${video.title}`}
                style={{
                  width: "48px",
                  height: "48px",
                  objectFit: "cover",
                  borderRadius: "var(--ks-border-radius-small)",
                }}
              />
            ) : null}
          </CellContainer>
          <CellLink href={`/videos/${video.id}`}>{video.title}</CellLink>
          <CellContainer>{video.author || "N/A"}</CellContainer>
          <CellContainer>
            <Pill
              color={sourceTypeTones[video.sourceType] || "gray"}
              weight="light"
            >
              {video.sourceType}
            </Pill>
          </CellContainer>
          <CellContainer>
            <StatusCircle
              video={video}
              verificationStatus={verificationStatus[video.id]}
              onCheck={() => checkSingleVideo(video)}
              disabled={isVerifying}
            />
          </CellContainer>
        </Box>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            padding: "24px 0",
          }}
        >
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: currentPage === 0 ? "#f3f4f6" : "#fff",
              color: currentPage === 0 ? "#9ca3af" : "#374151",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            <ChevronLeftIcon size="small" /> Prev
          </button>
          <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Page <strong>{currentPage + 1}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background:
                currentPage >= totalPages - 1 ? "#f3f4f6" : "#fff",
              color: currentPage >= totalPages - 1 ? "#9ca3af" : "#374151",
              cursor:
                currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Next <ChevronRightIcon size="small" />
          </button>
        </Box>
      )}

      <StatusLogModal
        logs={logEntries}
        isOpen={logModalOpen}
        isRunning={isVerifying}
        checked={checkedCount}
        total={checkTotal}
        onClose={() => setLogModalOpen(false)}
        onCancel={() => { cancelRef.current = true; }}
      />
    </PageContainer>
  );
}
