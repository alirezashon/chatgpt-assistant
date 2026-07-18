import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Clipboard, Download, Keyboard, Mic2, Send, Square, Volume2 } from 'lucide-react';

import { Button, IconButton, Panel, SectionTitle } from '@/design-system';
import {
  convertEnglishDigitsToPersian,
  convertEnglishKeyboardToPersian,
  convertPersianDigitsToEnglish,
  convertPersianKeyboardToEnglish,
  normalizePersianCharacters,
  type AppLocale,
} from '@/i18n';
import { executeScript, getActiveTab } from '@/lib/chrome/chrome-api';

import type { SidebarTask } from './sidebar-workspace-types';

interface LanguageStudioCopy {
  readonly copy: string;
  readonly download: string;
  readonly englishDigits: string;
  readonly englishKeyboard: string;
  readonly insert: string;
  readonly languageStudio: string;
  readonly normalizePersian: string;
  readonly persianDigits: string;
  readonly persianKeyboard: string;
  readonly speak: string;
  readonly speechToText: string;
  readonly stop: string;
  readonly textInput: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function LanguageStudioPanel({
  copy,
  locale,
  task,
}: {
  readonly copy: LanguageStudioCopy;
  readonly locale: AppLocale;
  readonly task: SidebarTask;
}) {
  const [text, setText] = useState(initialTextForTask(task));
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const languageMode = task.actionId.startsWith('language.');

  if (!languageMode) {
    return null;
  }

  const applyTransform = (transform: (value: string) => string): void => {
    setText((value) => transform(value));
  };

  const handleSpeak = (): void => {
    if (typeof speechSynthesis === 'undefined') {
      toast.error('Speech synthesis is not available');
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'fa' ? 'fa-IR' : 'en-US';
    const voice = speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()));

    if (voice !== undefined) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  };

  const handleStop = (): void => {
    speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleDictation = (): void => {
    const Recognition = speechRecognitionConstructor();

    if (Recognition === null) {
      toast.error('Speech recognition is not available');
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale === 'fa' ? 'fa-IR' : 'en-US';
    recognition.onresult = (event) => {
      let transcript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? '';
      }

      setText((value) => `${value}${value.length === 0 ? '' : ' '}${transcript}`.trim());
    };
    recognition.onerror = (event) => {
      toast.error(event.error);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    toast.success('Text copied');
  };

  const handleDownload = (): void => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'language-text.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleInsert = async (): Promise<void> => {
    const tab = await getActiveTab();

    if (tab?.id === undefined) {
      toast.error('No active tab');
      return;
    }

    const [result] = await executeScript<
      [string],
      { readonly ok: boolean; readonly reason?: string }
    >({
      args: [text],
      target: { tabId: tab.id },
      func: insertTextIntoActivePage,
    });

    if (result?.result?.ok === true) {
      toast.success('Inserted into page');
    } else {
      toast.error(result?.result?.reason ?? 'No editable input found');
    }
  };

  return (
    <Panel className="p-[var(--ds-space-3)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
        <SectionTitle icon={Keyboard} title={copy.languageStudio} />
        <div className="flex items-center gap-[var(--ds-space-1)]">
          <IconButton
            icon={Clipboard}
            label={copy.copy}
            size="sm"
            onClick={() => {
              void handleCopy();
            }}
          />
          <IconButton icon={Download} label={copy.download} size="sm" onClick={handleDownload} />
          <IconButton
            icon={Send}
            label={copy.insert}
            size="sm"
            onClick={() => {
              void handleInsert();
            }}
          />
        </div>
      </div>
      <textarea
        className="mt-[var(--ds-space-3)] min-h-[10rem] w-full resize-y rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text)] outline-none"
        dir="auto"
        placeholder={copy.textInput}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <div className="mt-[var(--ds-space-3)] flex flex-wrap gap-[var(--ds-space-2)]">
        <Button icon={Volume2} size="sm" onClick={handleSpeak}>
          {copy.speak}
        </Button>
        <Button disabled={listening} icon={Mic2} size="sm" onClick={handleDictation}>
          {copy.speechToText}
        </Button>
        <Button icon={Square} size="sm" onClick={handleStop}>
          {copy.stop}
        </Button>
        <Button size="sm" onClick={() => applyTransform(convertPersianDigitsToEnglish)}>
          {copy.englishDigits}
        </Button>
        <Button size="sm" onClick={() => applyTransform(convertEnglishDigitsToPersian)}>
          {copy.persianDigits}
        </Button>
        <Button size="sm" onClick={() => applyTransform(normalizePersianCharacters)}>
          {copy.normalizePersian}
        </Button>
        <Button size="sm" onClick={() => applyTransform(convertEnglishKeyboardToPersian)}>
          {copy.persianKeyboard}
        </Button>
        <Button size="sm" onClick={() => applyTransform(convertPersianKeyboardToEnglish)}>
          {copy.englishKeyboard}
        </Button>
      </div>
    </Panel>
  );
}

function initialTextForTask(task: SidebarTask): string {
  return task.results
    .flatMap((result) => result.content)
    .join('\n')
    .slice(0, 1200);
}

function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const candidate = window as Window &
    Partial<{
      SpeechRecognition: SpeechRecognitionConstructor;
      webkitSpeechRecognition: SpeechRecognitionConstructor;
    }>;

  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

function insertTextIntoActivePage(text: string): {
  readonly ok: boolean;
  readonly reason?: string;
} {
  const active = document.activeElement;

  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const start = active.selectionStart ?? active.value.length;
    const end = active.selectionEnd ?? active.value.length;
    active.value = `${active.value.slice(0, start)}${text}${active.value.slice(end)}`;
    active.dispatchEvent(new Event('input', { bubbles: true }));
    active.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true };
  }

  if (active instanceof HTMLElement && active.isContentEditable) {
    active.focus();
    insertTextWithSelection(text);
    active.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    return { ok: true };
  }

  return { ok: false, reason: 'No editable input is focused.' };
}

function insertTextWithSelection(text: string): void {
  const selection = window.getSelection();

  if (selection === null || selection.rangeCount === 0) {
    document.activeElement?.append(document.createTextNode(text));
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}
