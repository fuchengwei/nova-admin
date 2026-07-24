import { Input, type InputRef } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { filterIconCatalog, iconCatalog, type IconCatalogItem } from './icon-catalog';

interface IconPickerPanelProps {
  value?: string;
  onSelect: (name: string) => void;
}

export default function IconPickerPanel({ value, onSelect }: IconPickerPanelProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef<InputRef>(null);

  const filtered = useMemo(() => filterIconCatalog(iconCatalog, keyword), [keyword]);

  useEffect(() => {
    // 面板挂载后让搜索框获得焦点
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex w-72 flex-col gap-2 p-2">
      <Input
        ref={inputRef}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t('iconPicker.search')}
        allowClear
        size="small"
      />

      {filtered.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">
          {t('iconPicker.noResult')}
        </div>
      ) : (
        <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto">
          {filtered.map((item: IconCatalogItem) => (
            <IconCell
              key={item.name}
              item={item}
              selected={item.name === value}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface IconCellProps {
  item: IconCatalogItem;
  selected: boolean;
  onSelect: (name: string) => void;
}

function IconCell({ item, selected, onSelect }: IconCellProps) {
  const IconComp = item.icon;
  return (
    <button
      type="button"
      title={item.name}
      aria-label={item.name}
      aria-pressed={selected}
      onClick={() => onSelect(item.name)}
      className={[
        'flex aspect-square items-center justify-center rounded text-base',
        'cursor-pointer border transition-colors',
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-transparent text-gray-600 hover:bg-gray-100',
      ].join(' ')}
    >
      <IconComp />
    </button>
  );
}
