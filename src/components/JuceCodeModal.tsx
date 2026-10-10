import React, { useState } from 'react';
import { getJuceProjectFiles, JuceProjectFile } from '../services/juceProjectGenerator';
import { Download, Copy, Check, Terminal, FileCode, X, Layers } from 'lucide-react';

interface JuceCodeModalProps {
  onClose: () => void;
}

export const JuceCodeModal: React.FC<JuceCodeModalProps> = ({ onClose }) => {
  const files = getJuceProjectFiles();
  const [selectedFile, setSelectedFile] = useState<JuceProjectFile>(files[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate an individual download or concatenated package
    const combinedContent = files.map(f => `// ========================================================\n// FILE: ${f.path}\n// ========================================================\n\n${f.content}\n\n`).join('\n');
    const blob = new Blob([combinedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HiHatPercProgrammer_JUCE_SourceBundle.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadActiveFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2e3444] rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden hardware-chassis">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#262c3a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>JUCE C++ VST3 Plugin Source Code Package</span>
                <span className="text-xs text-cyan-400 font-mono-numbers font-normal">
                  · C++20 / CMake
                </span>
              </h2>
              <p className="text-xs text-slate-400">Production JUCE classes for in-DAW host sync, choke state machine, &amp; cubic Hermite DSP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project Bundle</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252b38] rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Build Instruction Ribbon */}
        <div className="bg-[#12141a] px-4 py-2.5 border-b border-[#232835] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-400">Build Command:</span>
            <code className="font-mono-numbers bg-[#1a1d26] px-2 py-0.5 rounded text-cyan-300 border border-[#2c3344]">
              cmake -B build -DCMAKE_BUILD_TYPE=Release &amp;&amp; cmake --build build
            </code>
          </div>
          <span className="text-[11px] text-slate-400">Compatible with macOS, Windows 11 &amp; Linux</span>
        </div>

        {/* Main Content: Left File Explorer + Right Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-[#14161c] border-r border-[#242937] p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Project Structure
            </div>

            {files.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1d212b]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-[#101217] overflow-hidden">
            {/* Code Header */}
            <div className="p-3 border-b border-[#202533] bg-[#14161d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-numbers text-slate-200 font-semibold">
                  {selectedFile.path}
                </span>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  · {selectedFile.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2b3244] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadActiveFile}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2b3244] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <pre className="flex-1 overflow-auto p-4 font-mono-numbers text-xs text-slate-300 leading-relaxed bg-[#0d0f14] selection:bg-cyan-500/30">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
