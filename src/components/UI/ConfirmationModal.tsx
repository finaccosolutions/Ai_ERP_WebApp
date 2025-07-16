// src/components/UI/ConfirmationModal.tsx
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmationModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${theme.cardBg}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white
              `}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${theme.textMuted} hover:${theme.textPrimary}`}
            >
              <X size={20} />
            </button>
          </div>

          <p className={`text-sm ${theme.textMuted} mb-6`}>
            {message}
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
            <Button onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ConfirmationModal;