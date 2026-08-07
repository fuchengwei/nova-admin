import { Popover, Tooltip } from 'antd';
import { AppstoreOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { iconCatalogMap } from './icon-catalog';
import IconPickerPanel from './IconPickerPanel';

export interface IconPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function IconPicker({
  value,
  onChange,
  disabled = false,
  placeholder,
}: IconPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const resolvedPlaceholder = placeholder ?? t('iconPicker.placeholder');
  const catalogItem = value ? iconCatalogMap.get(value) : undefined;
  const isUnknown = !!value && !catalogItem;
  const IconComp = catalogItem ? catalogItem.icon : AppstoreOutlined;

  // Escape 关闭面板并恢复触发器焦点
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (name: string) => {
    onChange?.(name);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
    setOpen(false);
  };

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setOpen((v) => !v)}
      className={[
        'flex h-8 w-full items-center gap-2 rounded border px-3 text-left text-sm',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
          : 'cursor-pointer border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--ant-color-primary)]',
      ].join(' ')}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      {value ? (
        <>
          <span className={isUnknown ? 'text-gray-400' : 'text-gray-600'}>
            <IconComp />
          </span>
          <span className="flex-1 truncate text-gray-700">{value}</span>
          {isUnknown && (
            <Tooltip title={t('iconPicker.unknownIcon')}>
              <span className="text-xs text-amber-500">?</span>
            </Tooltip>
          )}
        </>
      ) : (
        <span className="flex-1 text-gray-400">{resolvedPlaceholder}</span>
      )}

      {value && !disabled && (
        <span
          role="button"
          aria-label={t('iconPicker.clear')}
          onClick={handleClear}
          className="flex items-center text-gray-400 hover:text-gray-600"
        >
          <CloseCircleFilled style={{ fontSize: 12 }} />
        </span>
      )}
    </button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (!disabled) setOpen(v);
      }}
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      content={open ? <IconPickerPanel value={value} onSelect={handleSelect} /> : null}
    >
      {trigger}
    </Popover>
  );
}
