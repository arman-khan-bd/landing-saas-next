"use client";

import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      button: 'bg-rose-600 hover:bg-rose-700',
      text: 'text-rose-900',
    },
    primary: {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      button: 'bg-primary hover:bg-primary/90',
      text: 'text-indigo-900',
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700',
      text: 'text-amber-900',
    },
  };

  const theme = themes[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
        <div className={`p-8 ${theme.bg} border-b ${theme.border} relative`}>
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/50 text-slate-400 transition-colors"
            >
               <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                  {theme.icon}
               </div>
               <div className="space-y-1">
                  <h3 className={`text-2xl font-headline font-black tracking-tight ${theme.text} uppercase`}>
                    {title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed px-4">
                    {message}
                  </p>
               </div>
            </div>
        </div>
        
        <div className="p-6 flex flex-col sm:flex-row gap-3">
           <Button 
             variant="ghost" 
             onClick={onCancel}
             className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 order-2 sm:order-1"
           >
             {cancelText}
           </Button>
           <Button 
             onClick={onConfirm}
             className={`flex-1 h-14 rounded-2xl font-black text-white shadow-xl order-1 sm:order-2 ${theme.button}`}
           >
             {confirmText}
           </Button>
        </div>
      </div>
    </div>
  );
};
