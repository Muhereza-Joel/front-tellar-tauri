// components/ConfirmDeleteButton.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteButtonProps {
  /** Function to call when delete is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Name of the item being deleted (shown in confirmation message) */
  itemName?: string;
  /** Optional modal title (default: "Delete Confirmation") */
  title?: string;
  /** Optional confirmation message (overrides default) */
  message?: string;
  /** Optional confirm button text (default: "Delete") */
  confirmText?: string;
  /** Optional cancel button text (default: "Cancel") */
  cancelText?: string;
  /** Whether the delete action is in loading state */
  isLoading?: boolean;
  /** Custom button className (default matches original delete icon style) */
  buttonClassName?: string;
  /** Custom icon size (default: 16) */
  iconSize?: number;
  /** Disable the button */
  disabled?: boolean;
}

export default function ConfirmDeleteButton({
  onConfirm,
  itemName,
  title = "Delete Confirmation",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  buttonClassName = "p-2 text-zinc-400 hover:text-red-500",
  iconSize = 16,
  disabled = false,
}: ConfirmDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Default message based on itemName
  const confirmationMessage =
    message ||
    (itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone.");

  // Handle confirm action
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      setIsOpen(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button - exactly matching original delete icon style */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        disabled={disabled}
      >
        <Trash2 size={iconSize} />
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div
            ref={modalRef}
            className="relative bg-white dark:bg-black rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden transition-all animate-in fade-in zoom-in duration-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm text-left font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                {title}
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-left text-zinc-600 dark:text-zinc-400">
                {confirmationMessage}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional: Add this to your global CSS for the animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoom-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .zoom-in {
          animation-name: zoom-in;
        }
      `}</style>
    </>
  );
}
