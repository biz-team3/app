import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Braces, Code2, Database, FileCode2, Monitor, RefreshCcw, Route, Server } from "lucide-react";
import { Link } from "react-router-dom";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";
import "monaco-editor/esm/vs/basic-languages/xml/xml.contribution";
import { PRESENTATION_GROUPS } from "./presentationCodeSnippets.js";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

const KIND_ICONS = {
  Backend: Server,
  DB: Database,
  Frontend: Monitor,
  Fullstack: Braces,
  MyBatis: FileCode2,
  구조: Route,
};

const editorOptions = {
  automaticLayout: true,
  fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
  fontLigatures: true,
  fontSize: 15,
  lineHeight: 24,
  minimap: { enabled: false },
  padding: { top: 18, bottom: 18 },
  readOnly: true,
  renderLineHighlight: "all",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 2,
  wordWrap: "on",
};

export function PresentationModePage() {
  const [activeGroupId, setActiveGroupId] = useState(PRESENTATION_GROUPS[0].id);
  const activeGroup = PRESENTATION_GROUPS.find((group) => group.id === activeGroupId) || PRESENTATION_GROUPS[0];
  const [activeSectionId, setActiveSectionId] = useState(activeGroup.sections[0].id);
  const [iframePath, setIframePath] = useState(activeGroup.appPath);
  const [frameVersion, setFrameVersion] = useState(0);

  const activeSection = useMemo(() => {
    return activeGroup.sections.find((section) => section.id === activeSectionId) || activeGroup.sections[0];
  }, [activeGroup, activeSectionId]);

  const KindIcon = KIND_ICONS[activeSection.kind] || Code2;

  useEffect(() => {
    const ignoreMonacoCancellation = (event) => {
      if (event.reason?.name === "Canceled" || event.reason?.name === "CancellationError" || event.reason?.message === "Canceled") {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", ignoreMonacoCancellation);
    return () => window.removeEventListener("unhandledrejection", ignoreMonacoCancellation);
  }, []);

  const handleGroupChange = (groupId) => {
    const nextGroup = PRESENTATION_GROUPS.find((group) => group.id === groupId);
    if (!nextGroup) return;
    setActiveGroupId(nextGroup.id);
    setActiveSectionId(nextGroup.sections[0].id);
    setIframePath(nextGroup.appPath);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="grid h-screen grid-cols-[minmax(520px,1fr)_minmax(520px,44vw)]">
        <section className="flex min-w-0 flex-col border-r border-white/10 bg-[#f5f6f8]">
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 text-gray-950">
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
                앱으로
              </Link>
              <span className="h-5 w-px bg-gray-200" />
              <div>
                <p className="text-sm font-bold">시연 화면</p>
                <p className="text-[11px] text-gray-500">왼쪽은 실제 웹앱, 오른쪽은 발표 코드 패널</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {["/", "/profile", "/admin", "/settings"].map((path) => (
                <button
                  key={path}
                  onClick={() => setIframePath(path)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${
                    iframePath === path ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {path === "/" ? "feed" : path.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setFrameVersion((value) => value + 1)}
                className="rounded-md bg-gray-100 p-1.5 text-gray-700 hover:bg-gray-200"
                aria-label="시연 화면 새로고침"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 bg-[#d8dbe2] p-4">
            <div className="h-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl">
              <iframe
                key={`${iframePath}:${frameVersion}`}
                src={iframePath}
                title="presentation app preview"
                className="h-full w-full bg-white"
              />
            </div>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col bg-[#111418]">
          <header className="border-b border-white/10 bg-[#171a20] px-5 py-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Presentation Code Inspector</p>
                <h1 className="mt-1 text-xl font-black">{activeGroup.speaker}: {activeGroup.title}</h1>
                <p className="mt-1 text-sm text-gray-400">{activeGroup.summary}</p>
              </div>
              <span className="shrink-0 rounded-full border border-cyan-400/40 px-3 py-1 text-xs font-bold text-cyan-200">
                {activeGroup.duration}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRESENTATION_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupChange(group.id)}
                  className={`rounded-md border px-3 py-2 text-left transition ${
                    group.id === activeGroup.id
                      ? "border-cyan-300 bg-cyan-300 text-gray-950"
                      : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/25 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="block text-xs font-black">{group.speaker}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-semibold opacity-80">{group.title}</span>
                </button>
              ))}
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <nav className="w-48 shrink-0 overflow-y-auto border-r border-white/10 bg-[#12151b] p-3">
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Sections</p>
              <div className="flex flex-col gap-1.5">
                {activeGroup.sections.map((section) => {
                  const SectionIcon = KIND_ICONS[section.kind] || Code2;
                  const active = section.id === activeSection.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionId(section.id)}
                      className={`flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm ${
                        active ? "bg-white text-gray-950" : "text-gray-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <SectionIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="block font-bold">{section.label}</span>
                        <span className={`block text-[11px] ${active ? "text-gray-500" : "text-gray-500"}`}>{section.kind}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="border-b border-white/10 bg-[#1b1f27] px-4 py-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <KindIcon className="h-4 w-4 text-cyan-300" />
                      <h2 className="truncate text-sm font-black">{activeSection.label}</h2>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-gray-400">{activeSection.file}</p>
                  </div>
                  <select
                    value={activeSection.id}
                    onChange={(event) => setActiveSectionId(event.target.value)}
                    className="rounded-md border border-white/10 bg-[#111418] px-3 py-2 text-xs font-bold text-gray-200 outline-none"
                  >
                    {activeGroup.sections.map((section) => (
                      <option key={section.id} value={section.id}>{section.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {activeSection.talkingPoints.map((point) => (
                    <div key={point} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-gray-300">
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <CodeEditor code={activeSection.code} language={activeSection.language} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CodeEditor({ code, language }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return undefined;

    monaco.editor.defineTheme("presentation-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a9955", fontStyle: "italic" },
        { token: "keyword", foreground: "c586c0", fontStyle: "bold" },
        { token: "string", foreground: "ce9178" },
        { token: "number", foreground: "b5cea8" },
        { token: "type", foreground: "4ec9b0" },
      ],
      colors: {
        "editor.background": "#15181d",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#20242c",
        "editorLineNumber.foreground": "#5b6270",
        "editorLineNumber.activeForeground": "#c9d1d9",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#f8f8f0",
      },
    });

    editorRef.current = monaco.editor.create(containerRef.current, {
      ...editorOptions,
      language,
      theme: "presentation-dark",
      value: code,
    });

    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    model.setValue(code);
    monaco.editor.setModelLanguage(model, language);
    editorRef.current.setScrollTop(0);
  }, [code, language]);

  return <div ref={containerRef} className="min-h-0 flex-1" />;
}
