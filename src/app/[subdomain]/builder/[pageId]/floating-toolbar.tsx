"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bold, Italic, Strikethrough, Underline, Palette, PaintBucket, Maximize, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingTextToolbar() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : "";
        const activeEl = document.activeElement as HTMLElement;
        
        if (toolbarRef.current && toolbarRef.current.matches(':hover')) {
          return;
        }

        const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
        let hasSelection = false;
        let rect = null;

        if (isInput) {
          const input = activeEl as HTMLInputElement | HTMLTextAreaElement;
          if (input.type === 'color' || input.type === 'number') {
            setVisible(false);
            return;
          }
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          if (start !== end) {
            hasSelection = true;
            rect = input.getBoundingClientRect();
            setActiveInput(input);
          }
        } else if (selectedText.trim().length > 0 && selection && selection.rangeCount > 0) {
          hasSelection = true;
          rect = selection.getRangeAt(0).getBoundingClientRect();
          setActiveInput(null);
        }

        if (hasSelection && rect && rect.width > 0) {
          let calculatedTop = rect.top - 55;
          if (calculatedTop < 10) {
             calculatedTop = rect.bottom + 10;
          }

          setPosition({
            top: calculatedTop,
            left: Math.max(10, rect.left + (rect.width / 2) - 150),
          });
          setVisible(true);
        } else {
          setVisible(false);
        }
      }, 50);
    };

    document.addEventListener("mouseup", checkSelection);
    document.addEventListener("keyup", checkSelection);
    document.addEventListener("selectionchange", checkSelection);
    
    return () => {
      document.removeEventListener("mouseup", checkSelection);
      document.removeEventListener("keyup", checkSelection);
      document.removeEventListener("selectionchange", checkSelection);
    };
  }, []);

  const applyFormat = (format: string, value?: string) => {
    if (!activeInput) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const selectedText = selection.toString();
      if (!selectedText.trim()) return;

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container;
      const blockEl = (element as HTMLElement)?.closest('[id]');
      
      if (blockEl && blockEl.id) {
        const event = new CustomEvent('format-canvas-text', {
          detail: { blockId: blockEl.id, selectedText, format, value }
        });
        document.dispatchEvent(event);
      }
      setVisible(false);
      return;
    }

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    if (start === end) return;

    const text = activeInput.value;
    const selectedText = text.substring(start, end);
    
    let formattedText = "";
    if (value) {
      formattedText = `[${format}=${value}:${selectedText}]`;
    } else {
      formattedText = `[${format}:${selectedText}]`;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    
    if (activeInput.tagName === "INPUT" && nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, newText);
    } else if (activeInput.tagName === "TEXTAREA" && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(activeInput, newText);
    }

    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);

    setVisible(false);
    activeInput.focus();
  };

  const removeFormatting = () => {
    if (!activeInput) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const selectedText = selection.toString();
      if (!selectedText.trim()) return;

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container;
      const blockEl = (element as HTMLElement)?.closest('[id]');
      
      if (blockEl && blockEl.id) {
        // format="remove" tells the page to strip tags from the selected text
        const event = new CustomEvent('format-canvas-text', {
          detail: { blockId: blockEl.id, selectedText, format: "remove" }
        });
        document.dispatchEvent(event);
      }
      setVisible(false);
      return;
    }
    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    if (start === end) return;

    const text = activeInput.value;
    const selectedText = text.substring(start, end);
    
    // Naive regex to strip [tag:text] or [tag=val:text]
    const strippedText = selectedText.replace(/\[[a-zA-Z0-9-]+(?:=[^:]+)?:(.*?)\]/g, '$1');

    const newText = text.substring(0, start) + strippedText + text.substring(end);
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    
    if (activeInput.tagName === "INPUT" && nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, newText);
    } else if (activeInput.tagName === "TEXTAREA" && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(activeInput, newText);
    }

    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);

    setVisible(false);
    activeInput.focus();
  };

  if (!visible) return null;

  return (
    <div 
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center gap-1 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-1.5 animate-in fade-in zoom-in duration-200"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()} // Keep focus on input
    >
      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg" onClick={() => applyFormat('b')}>
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg" onClick={() => applyFormat('i')}>
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg" onClick={() => applyFormat('u')}>
        <Underline className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg" onClick={() => applyFormat('s')}>
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-4 bg-slate-700 mx-1" />
      
      {/* Color Dropdown */}
      <div className="relative group/color">
        <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg">
          <Palette className="w-3.5 h-3.5" />
        </Button>
        <div className="absolute hidden group-hover/color:flex flex-wrap w-24 bg-slate-800 border border-slate-700 rounded-lg p-1 bottom-full left-0 mb-1 shadow-xl">
           {['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ffffff', '#1e293b'].map(c => (
             <div key={c} className="w-5 h-5 rounded m-0.5 cursor-pointer hover:scale-110 transition-transform border border-slate-600" style={{ backgroundColor: c }} onClick={() => applyFormat('c', c)} />
           ))}
        </div>
      </div>

      {/* BG Color Dropdown */}
      <div className="relative group/bg">
        <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg">
          <PaintBucket className="w-3.5 h-3.5" />
        </Button>
        <div className="absolute hidden group-hover/bg:flex flex-wrap w-24 bg-slate-800 border border-slate-700 rounded-lg p-1 bottom-full left-0 mb-1 shadow-xl">
           {['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#000000', '#f1f5f9', '#fef08a'].map(c => (
             <div key={c} className="w-5 h-5 rounded m-0.5 cursor-pointer hover:scale-110 transition-transform border border-slate-600" style={{ backgroundColor: c }} onClick={() => applyFormat('bg', c)} />
           ))}
        </div>
      </div>

      {/* Padding */}
      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-slate-800 hover:text-white rounded-lg" onClick={() => applyFormat('pad', '8px')}>
        <Maximize className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Animations Dropdown */}
      <div className="relative group/anim">
        <Button variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 hover:text-white rounded-lg px-2">
          FX
        </Button>
        <div className="absolute hidden group-hover/anim:flex flex-col bg-slate-800 border border-slate-700 rounded-lg p-1 bottom-full right-0 mb-1 shadow-xl w-24">
           {['joy', 'bounce', 'celebrate', 'cross', 'underline'].map(a => (
             <div key={a} className="text-[10px] text-white p-1.5 hover:bg-slate-700 rounded-md cursor-pointer uppercase font-bold" onClick={() => applyFormat(a)}>
               {a}
             </div>
           ))}
        </div>
      </div>

      {/* Clear Formatting */}
      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg ml-1" onClick={removeFormatting}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
