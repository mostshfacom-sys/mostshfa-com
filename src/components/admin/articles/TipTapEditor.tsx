'use client';

import { useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils/cn';

export interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const ToolbarButton = ({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'px-2 py-1 rounded border text-sm transition-colors',
        active
          ? 'bg-primary-50 border-primary-200 text-primary-700'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  );
};

export default function TipTapEditor({ value, onChange, placeholder, className }: TipTapEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'اكتب المحتوى هنا...'
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none prose-headings:scroll-mt-24 prose-p:leading-relaxed',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== current) {
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn('border border-gray-200 rounded-lg p-4 bg-white', className)}>
        <div className="text-sm text-gray-500">جاري تحميل المحرر...</div>
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('أدخل الرابط', previousUrl || '');
    if (url === null) return;

    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
        <ToolbarButton
          title="عنوان رئيسي"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="عنوان فرعي"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <div className="w-px bg-gray-200 mx-1" />
        <ToolbarButton
          title="عريض"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="مائل"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          title="اقتباس"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </ToolbarButton>
        <div className="w-px bg-gray-200 mx-1" />
        <ToolbarButton
          title="قائمة نقطية"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          title="قائمة مرقمة"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
        <div className="w-px bg-gray-200 mx-1" />
        <ToolbarButton
          title="رابط"
          active={editor.isActive('link')}
          onClick={setLink}
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          title="إزالة التنسيق"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          ✕
        </ToolbarButton>
      </div>

      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
