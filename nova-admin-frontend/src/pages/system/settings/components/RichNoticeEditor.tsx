import { useEffect, useState } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  MenuOutlined,
  MinusOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Input, Popover, Tooltip } from 'antd';
import { EditorContent, useEditor } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { useTranslation } from 'react-i18next';

interface RichNoticeEditorProps {
  value?: string;
  onChange: (value: string) => void;
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        className="notice-editor-toolbar-button"
        color={active ? 'primary' : 'default'}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        size="small"
        variant={active ? 'solid' : 'text'}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export default function RichNoticeEditor({ value, onChange }: RichNoticeEditorProps) {
  const { t } = useTranslation();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        openOnClick: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'notice-editor-content',
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor || value === undefined || value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const applyLink = () => {
    const href = linkUrl.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  };
  const canUndo = editor.can().chain().focus().undo().run();
  const canRedo = editor.can().chain().focus().redo().run();

  return (
    <div className="notice-editor-shell">
      <div
        className="notice-editor-toolbar"
        role="toolbar"
        aria-label={t('settings.noticeToolbar')}
      >
        <ToolbarButton
          label={t('settings.noticeHeadingTwo')}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeHeadingThree')}
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeBold')}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeItalic')}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeStrike')}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughOutlined />
        </ToolbarButton>
        <span className="notice-editor-toolbar-separator" />
        <ToolbarButton
          label={t('settings.noticeAlignLeft')}
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeftOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeAlignCenter')}
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenterOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeAlignRight')}
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRightOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeAlignJustify')}
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <MenuOutlined />
        </ToolbarButton>
        <span className="notice-editor-toolbar-separator" />
        <ToolbarButton
          label={t('settings.noticeBulletList')}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <UnorderedListOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeOrderedList')}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListOutlined />
        </ToolbarButton>
        <ToolbarButton
          label={t('settings.noticeQuote')}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &#8220;
        </ToolbarButton>
        <Popover
          content={
            <div className="flex w-64 gap-2">
              <Input
                autoFocus
                onChange={(event) => setLinkUrl(event.target.value)}
                onPressEnter={applyLink}
                placeholder={t('settings.noticeLinkPlaceholder')}
                value={linkUrl}
              />
              <Button onClick={applyLink} type="primary">
                {t('settings.noticeLinkApply')}
              </Button>
            </div>
          }
          onOpenChange={setLinkOpen}
          open={linkOpen}
          trigger="click"
        >
          <span>
            <ToolbarButton
              label={t('settings.noticeLink')}
              active={editor.isActive('link')}
              onClick={() => setLinkOpen(true)}
            >
              <LinkOutlined />
            </ToolbarButton>
          </span>
        </Popover>
        <ToolbarButton
          label={t('settings.noticeDivider')}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <MinusOutlined />
        </ToolbarButton>
        <span className="notice-editor-toolbar-separator" />
        <ToolbarButton
          disabled={!canUndo}
          label={t('settings.noticeUndo')}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoOutlined />
        </ToolbarButton>
        <ToolbarButton
          disabled={!canRedo}
          label={t('settings.noticeRedo')}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoOutlined />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
