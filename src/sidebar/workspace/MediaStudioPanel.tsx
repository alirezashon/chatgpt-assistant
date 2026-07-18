import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  Image,
  Paperclip,
  RotateCw,
  Scissors,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';

import { Button, IconButton, Panel, SectionTitle } from '@/design-system';
import { executeScript, getActiveTab } from '@/lib/chrome/chrome-api';

import type { SidebarMediaAsset, SidebarTask } from './sidebar-workspace-types';

interface MediaStudioCopy {
  readonly attach: string;
  readonly brightness: string;
  readonly contrast: string;
  readonly crop: string;
  readonly download: string;
  readonly gallery: string;
  readonly mediaStudio: string;
  readonly readSources: string;
  readonly renderClip: string;
  readonly saturation: string;
  readonly upload: string;
}

interface PageMediaSource {
  readonly kind: 'image' | 'video';
  readonly name: string;
  readonly url: string;
}

interface MediaDimensions {
  readonly durationSec?: number;
  readonly height?: number;
  readonly width?: number;
}

export function MediaStudioPanel({
  copy,
  onUpdateTask,
  task,
}: {
  readonly copy: MediaStudioCopy;
  readonly onUpdateTask: (updater: (task: SidebarTask) => SidebarTask) => void;
  readonly task: SidebarTask;
}) {
  const assets = task.mediaAssets ?? [];
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets[0]?.id ?? null);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ height: 512, width: 512, x: 0, y: 0 });
  const [clip, setClip] = useState({ end: 5, start: 0 });
  const [videoDuration, setVideoDuration] = useState(5);

  const mediaMode =
    task.actionId === 'image.edit' || task.actionId === 'video.cut' || assets.length > 0;

  useEffect(() => {
    if (selectedAsset?.kind !== 'image') {
      return;
    }

    renderImagePreview({
      asset: selectedAsset,
      brightness,
      canvas: imageCanvasRef.current,
      contrast,
      crop,
      rotation,
      saturation,
    });
  }, [brightness, contrast, crop, rotation, saturation, selectedAsset]);

  const hasImage = selectedAsset?.kind === 'image';
  const hasVideo = selectedAsset?.kind === 'video';
  const canAttach = selectedAsset?.dataUrl !== undefined;

  if (!mediaMode) {
    return null;
  }

  const updateAssets = (nextAssets: readonly SidebarMediaAsset[]): void => {
    onUpdateTask((currentTask) => ({
      ...currentTask,
      mediaAssets: nextAssets,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addAssets = (nextAssets: readonly SidebarMediaAsset[]): void => {
    const merged = [...nextAssets, ...assets].slice(0, 12);
    updateAssets(merged);
    selectAsset(nextAssets[0]);
  };

  const selectAsset = (asset: SidebarMediaAsset | undefined): void => {
    if (asset === undefined) {
      return;
    }

    setSelectedAssetId(asset.id);

    if (asset.kind === 'image') {
      setCrop({
        height: asset.height ?? 512,
        width: asset.width ?? 512,
        x: 0,
        y: 0,
      });
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';

    if (files.length === 0) {
      return;
    }

    const uploaded = await Promise.all(files.map(fileToMediaAsset));
    addAssets(uploaded);
    toast.success('Media uploaded');
  };

  const handleReadSources = async (): Promise<void> => {
    const tab = await getActiveTab();

    if (tab?.id === undefined) {
      toast.error('No active tab');
      return;
    }

    const [result] = await executeScript<[], readonly PageMediaSource[]>({
      target: { tabId: tab.id },
      func: collectPageMediaSources,
    });
    const pageSources = result?.result ?? [];

    if (pageSources.length === 0) {
      toast.error('No media sources found');
      return;
    }

    const imported = await Promise.all(pageSources.slice(0, 8).map(pageSourceToAsset));
    addAssets(imported);
    toast.success('Page media loaded');
  };

  const handleApplyImage = (): void => {
    const canvas = imageCanvasRef.current;

    if (canvas === null || selectedAsset?.kind !== 'image') {
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const editedAsset: SidebarMediaAsset = {
      dataUrl,
      height: canvas.height,
      id: `media-${crypto.randomUUID()}`,
      kind: 'image',
      mimeType: 'image/png',
      name: editedName(selectedAsset.name, 'edited', 'png'),
      source: 'generated',
      width: canvas.width,
    };
    addAssets([editedAsset]);
    toast.success('Image edit saved');
  };

  const handleDownload = (): void => {
    if (selectedAsset === undefined) {
      return;
    }

    if (selectedAsset.dataUrl !== undefined) {
      downloadUrl(selectedAsset.dataUrl, selectedAsset.name);
      toast.success('Media downloaded');
      return;
    }

    if (selectedAsset.sourceUrl !== undefined) {
      window.open(selectedAsset.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAttach = async (): Promise<void> => {
    if (selectedAsset?.dataUrl === undefined) {
      toast.error('Save or upload a file first');
      return;
    }

    const tab = await getActiveTab();

    if (tab?.id === undefined) {
      toast.error('No active tab');
      return;
    }

    const [result] = await executeScript<
      [Readonly<{ dataUrl: string; mimeType: string; name: string }>],
      Promise<{ readonly ok: boolean; readonly reason?: string }>
    >({
      args: [
        {
          dataUrl: selectedAsset.dataUrl,
          mimeType: selectedAsset.mimeType,
          name: selectedAsset.name,
        },
      ],
      target: { tabId: tab.id },
      func: attachMediaToPageInput,
    });
    const attachResult = result?.result;

    if (attachResult?.ok === true) {
      toast.success('Attached to page input');
    } else {
      toast.error(attachResult?.reason ?? 'No file input found');
    }
  };

  const handleRenderClip = async (): Promise<void> => {
    const video = videoRef.current;

    if (video === null || selectedAsset?.kind !== 'video') {
      return;
    }

    try {
      const rendered = await renderVideoClip(video, selectedAsset, clip.start, clip.end);
      addAssets([rendered]);
      downloadUrl(rendered.dataUrl ?? '', rendered.name);
      toast.success('Clip rendered');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Video clip failed');
    }
  };

  const preview =
    selectedAsset === undefined ? null : (
      <div className="grid min-h-[18rem] place-items-center overflow-hidden rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
        {selectedAsset.kind === 'image' ? (
          <canvas className="max-h-[22rem] max-w-full" ref={imageCanvasRef} />
        ) : (
          <video
            className="max-h-[22rem] max-w-full"
            controls
            ref={videoRef}
            src={selectedAsset.dataUrl ?? selectedAsset.sourceUrl}
            onLoadedMetadata={(event) => {
              const duration = Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : 5;
              setVideoDuration(duration);
              setClip({ end: Math.min(duration, 5), start: 0 });
            }}
          />
        )}
      </div>
    );

  return (
    <Panel className="p-[var(--ds-space-3)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
        <SectionTitle icon={SlidersHorizontal} title={copy.mediaStudio} />
        <div className="flex items-center gap-[var(--ds-space-1)]">
          <Button
            icon={Image}
            size="sm"
            onClick={() => {
              void handleReadSources();
            }}
          >
            {copy.readSources}
          </Button>
          <label className="inline-flex h-[var(--ds-control-sm)] cursor-pointer items-center justify-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-secondary)] px-[var(--ds-space-2)] text-[length:var(--ds-font-caption)] font-medium text-[color:var(--ds-color-text)] transition hover:border-[color:var(--ds-color-border-strong)] hover:bg-[var(--ds-color-hover)]">
            <Upload aria-hidden="true" className="h-[var(--ds-icon-md)] w-[var(--ds-icon-md)]" />
            {copy.upload}
            <input
              accept="image/*,video/*"
              className="sr-only"
              multiple
              type="file"
              onChange={(event) => {
                void handleUpload(event);
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-3)] xl:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-[var(--ds-space-2)]">
          <div className="text-[length:var(--ds-font-caption)] font-medium leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
            {copy.gallery}
          </div>
          <div className="grid max-h-[22rem] gap-[var(--ds-space-1)] overflow-auto">
            {assets.map((asset) => (
              <button
                className={`grid grid-cols-[2.5rem_1fr] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border p-[var(--ds-space-2)] text-start transition ${
                  asset.id === selectedAsset?.id
                    ? 'border-[color:var(--ds-color-accent-border)] bg-[var(--ds-color-accent-surface)]'
                    : 'border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] hover:bg-[var(--ds-color-hover)]'
                }`}
                key={asset.id}
                type="button"
                onClick={() => {
                  selectAsset(asset);
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] text-[color:var(--ds-color-accent)]">
                  {asset.kind === 'image' ? (
                    <Image aria-hidden="true" />
                  ) : (
                    <Scissors aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[length:var(--ds-font-caption)] font-medium leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text)]">
                    {asset.name}
                  </span>
                  <span className="block truncate text-[length:var(--ds-font-label)] leading-[var(--ds-line-label)] text-[color:var(--ds-color-text-muted)]">
                    {asset.kind} - {asset.source}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-[var(--ds-space-3)]">
          {preview}
          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <Button
              disabled={!hasImage}
              icon={RotateCw}
              size="sm"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              90
            </Button>
            <Button disabled={!hasImage} icon={Image} size="sm" onClick={handleApplyImage}>
              {copy.crop}
            </Button>
            <Button
              disabled={!hasVideo}
              icon={Scissors}
              size="sm"
              onClick={() => void handleRenderClip()}
            >
              {copy.renderClip}
            </Button>
            <IconButton
              disabled={selectedAsset === undefined}
              icon={Download}
              label={copy.download}
              size="sm"
              onClick={handleDownload}
            />
            <IconButton
              disabled={!canAttach}
              icon={Paperclip}
              label={copy.attach}
              size="sm"
              onClick={() => {
                void handleAttach();
              }}
            />
          </div>
          {hasImage ? (
            <div className="grid gap-[var(--ds-space-2)] md:grid-cols-3">
              <RangeControl
                label={copy.brightness}
                max={180}
                min={20}
                value={brightness}
                onChange={setBrightness}
              />
              <RangeControl
                label={copy.contrast}
                max={180}
                min={20}
                value={contrast}
                onChange={setContrast}
              />
              <RangeControl
                label={copy.saturation}
                max={200}
                min={0}
                value={saturation}
                onChange={setSaturation}
              />
              <NumberControl
                label="X"
                max={selectedAsset.width ?? 4096}
                value={crop.x}
                onChange={(x) => setCrop((crop) => ({ ...crop, x }))}
              />
              <NumberControl
                label="Y"
                max={selectedAsset.height ?? 4096}
                value={crop.y}
                onChange={(y) => setCrop((crop) => ({ ...crop, y }))}
              />
              <NumberControl
                label="W"
                max={selectedAsset.width ?? 4096}
                min={1}
                value={crop.width}
                onChange={(width) => setCrop((crop) => ({ ...crop, width }))}
              />
              <NumberControl
                label="H"
                max={selectedAsset.height ?? 4096}
                min={1}
                value={crop.height}
                onChange={(height) => setCrop((crop) => ({ ...crop, height }))}
              />
            </div>
          ) : null}
          {hasVideo ? (
            <div className="grid gap-[var(--ds-space-2)] md:grid-cols-2">
              <NumberControl
                label="Start"
                max={clip.end}
                step={0.1}
                value={clip.start}
                onChange={(start) => setClip((clip) => ({ ...clip, start }))}
              />
              <NumberControl
                label="End"
                max={Math.max(videoDuration, clip.end, clip.start + 0.1)}
                min={clip.start + 0.1}
                step={0.1}
                value={clip.end}
                onChange={(end) => setClip((clip) => ({ ...clip, end }))}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  value,
}: {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly value: number;
}) {
  return (
    <label className="grid gap-[var(--ds-space-1)] text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function NumberControl({
  label,
  max,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  readonly label: string;
  readonly max: number;
  readonly min?: number;
  readonly onChange: (value: number) => void;
  readonly step?: number;
  readonly value: number;
}) {
  return (
    <label className="grid gap-[var(--ds-space-1)] text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
      <span>{label}</span>
      <input
        className="h-[var(--ds-control-sm)] rounded-[var(--ds-radius-md)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] px-[var(--ds-space-2)] text-[color:var(--ds-color-text)]"
        max={max}
        min={min}
        step={step}
        type="number"
        value={Number.isFinite(value) ? value : min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function renderImagePreview(input: {
  readonly asset: SidebarMediaAsset;
  readonly brightness: number;
  readonly canvas: HTMLCanvasElement | null;
  readonly contrast: number;
  readonly crop: {
    readonly height: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
  };
  readonly rotation: number;
  readonly saturation: number;
}): void {
  if (input.canvas === null) {
    return;
  }

  const source = input.asset.dataUrl ?? input.asset.sourceUrl;

  if (source === undefined) {
    return;
  }

  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  image.addEventListener('load', () => {
    const cropWidth = Math.max(1, Math.min(input.crop.width, image.naturalWidth - input.crop.x));
    const cropHeight = Math.max(1, Math.min(input.crop.height, image.naturalHeight - input.crop.y));
    const context = input.canvas?.getContext('2d');

    if (context === null || context === undefined || input.canvas === null) {
      return;
    }

    input.canvas.width = cropWidth;
    input.canvas.height = cropHeight;
    context.clearRect(0, 0, cropWidth, cropHeight);
    context.filter = `brightness(${input.brightness.toString()}%) contrast(${input.contrast.toString()}%) saturate(${input.saturation.toString()}%)`;
    context.save();
    context.translate(cropWidth / 2, cropHeight / 2);
    context.rotate((input.rotation * Math.PI) / 180);
    context.drawImage(
      image,
      Math.max(0, input.crop.x),
      Math.max(0, input.crop.y),
      cropWidth,
      cropHeight,
      -cropWidth / 2,
      -cropHeight / 2,
      cropWidth,
      cropHeight,
    );
    context.restore();
  });
  image.src = source;
}

async function fileToMediaAsset(file: File): Promise<SidebarMediaAsset> {
  const dataUrl = await blobToDataUrl(file);
  const dimensions = file.type.startsWith('image/')
    ? await readImageDimensions(dataUrl)
    : await readVideoDimensions(dataUrl);

  return {
    dataUrl,
    id: `media-${crypto.randomUUID()}`,
    kind: file.type.startsWith('video/') ? 'video' : 'image',
    mimeType: file.type || 'application/octet-stream',
    name: file.name,
    source: 'upload',
    ...dimensionsToAssetFields(dimensions),
  };
}

async function pageSourceToAsset(source: PageMediaSource): Promise<SidebarMediaAsset> {
  const fetched = source.kind === 'image' ? await fetchAsDataUrl(source.url) : null;
  const dimensions =
    fetched === null
      ? {}
      : source.kind === 'image'
        ? await readImageDimensions(fetched.dataUrl)
        : await readVideoDimensions(fetched.dataUrl);

  return {
    ...(fetched === null ? { sourceUrl: source.url } : { dataUrl: fetched.dataUrl }),
    ...dimensions,
    id: `media-${crypto.randomUUID()}`,
    kind: source.kind,
    mimeType: fetched?.mimeType ?? (source.kind === 'image' ? 'image/*' : 'video/*'),
    name: source.name,
    source: 'page',
  };
}

async function fetchAsDataUrl(
  url: string,
): Promise<{ readonly dataUrl: string; readonly mimeType: string } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return {
      dataUrl: await blobToDataUrl(blob),
      mimeType: blob.type,
    };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(reader.error ?? new Error('File read failed')));
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('File read did not return a data URL'));
      }
    });
    reader.readAsDataURL(blob);
  });
}

function readImageDimensions(dataUrl: string): Promise<MediaDimensions> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.addEventListener('load', () =>
      resolve({ height: image.naturalHeight, width: image.naturalWidth }),
    );
    image.addEventListener('error', () => resolve({ height: 512, width: 512 }));
    image.src = dataUrl;
  });
}

function readVideoDimensions(dataUrl: string): Promise<MediaDimensions> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.addEventListener('loadedmetadata', () => {
      const dimensions: MediaDimensions = {
        ...(Number.isFinite(video.duration) ? { durationSec: video.duration } : {}),
        ...(video.videoHeight > 0 ? { height: video.videoHeight } : {}),
        ...(video.videoWidth > 0 ? { width: video.videoWidth } : {}),
      };
      resolve(dimensions);
    });
    video.addEventListener('error', () => resolve({}));
    video.src = dataUrl;
  });
}

function dimensionsToAssetFields(dimensions: MediaDimensions): MediaDimensions {
  return {
    ...(dimensions.durationSec === undefined ? {} : { durationSec: dimensions.durationSec }),
    ...(dimensions.height === undefined ? {} : { height: dimensions.height }),
    ...(dimensions.width === undefined ? {} : { width: dimensions.width }),
  };
}

async function renderVideoClip(
  video: HTMLVideoElement,
  asset: SidebarMediaAsset,
  start: number,
  end: number,
): Promise<SidebarMediaAsset> {
  const captureStream = (
    video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    }
  ).captureStream;

  if (captureStream === undefined || typeof MediaRecorder === 'undefined') {
    throw new Error('Video clipping is not available in this browser.');
  }

  if (end <= start) {
    throw new Error('End time must be after start time.');
  }

  await seekVideo(video, start);
  const stream = captureStream.call(video);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });
  const stopped = new Promise<void>((resolve) => {
    recorder.addEventListener('stop', () => resolve(), { once: true });
  });
  recorder.start();
  await video.play();
  window.setTimeout(
    () => {
      video.pause();
      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    },
    Math.max(250, (end - start) * 1000),
  );
  await stopped;
  const blob = new Blob(chunks, { type: 'video/webm' });
  const dataUrl = await blobToDataUrl(blob);

  return {
    dataUrl,
    durationSec: end - start,
    id: `media-${crypto.randomUUID()}`,
    kind: 'video',
    mimeType: 'video/webm',
    name: editedName(asset.name, 'clip', 'webm'),
    source: 'generated',
  };
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handleSeeked = () => resolve();
    video.addEventListener('seeked', handleSeeked, { once: true });
    video.currentTime = time;
  });
}

function collectPageMediaSources(): readonly PageMediaSource[] {
  const sources: PageMediaSource[] = [];

  document.querySelectorAll<HTMLImageElement>('img[src]').forEach((image, index) => {
    const source = firstNonEmpty(image.currentSrc, image.src);

    if (source.length > 0) {
      sources.push({
        kind: 'image',
        name: `page-image-${(index + 1).toString()}.png`,
        url: new URL(source, location.href).href,
      });
    }
  });

  document.querySelectorAll<HTMLVideoElement>('video').forEach((video, index) => {
    const source = firstNonEmpty(
      video.currentSrc,
      video.src,
      video.querySelector<HTMLSourceElement>('source')?.src ?? '',
    );

    if (source.length > 0) {
      sources.push({
        kind: 'video',
        name: `page-video-${(index + 1).toString()}.mp4`,
        url: new URL(source, location.href).href,
      });
    }
  });

  return sources;
}

function firstNonEmpty(...values: readonly string[]): string {
  return values.find((value) => value.length > 0) ?? '';
}

async function attachMediaToPageInput(payload: {
  readonly dataUrl: string;
  readonly mimeType: string;
  readonly name: string;
}): Promise<{ readonly ok: boolean; readonly reason?: string }> {
  const input = [...document.querySelectorAll('input[type="file"]')].find(
    (candidate): candidate is HTMLInputElement =>
      candidate instanceof HTMLInputElement && !candidate.disabled,
  );

  if (input === undefined) {
    return { ok: false, reason: 'No file input found on this page.' };
  }

  const blob = await fetch(payload.dataUrl).then((response) => response.blob());
  const file = new File([blob], payload.name, { type: payload.mimeType });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  return { ok: true };
}

function downloadUrl(url: string, fileName: string): void {
  if (url.length === 0) {
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

function editedName(name: string, suffix: string, extension: string): string {
  return `${name.replace(/\.[^.]+$/u, '')}-${suffix}.${extension}`;
}
