'use client'

import type { ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyleKit } from '@tiptap/extension-text-style'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeightClass?: string
}

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  children,
  title,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 min-w-9 place-items-center border px-2 text-sm ${
        active
          ? 'border-[#171512] bg-[#171512] text-[#f8f1e6]'
          : 'border-black/15 bg-transparent hover:bg-black/5'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  minHeightClass = 'min-h-48',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit],

    content: value || '<p></p>',

    immediatelyRender: false,

    editorProps: {
      attributes: {
        class: `${minHeightClass} w-full bg-[#f8f3ea] px-4 py-4 text-base leading-7 outline-none sm:px-5`,
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="relative overflow-hidden border border-black/20 bg-[#f8f3ea]">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/15 bg-[#eee6da] p-2">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() =>
            editor.chain().focus().toggleUnderline().run()
          }
        >
          <span className="underline">U</span>
        </ToolbarButton>

        <ToolbarButton
          title="Heading"
          active={editor.isActive('heading', {
            level: 2,
          })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
        >
          H
        </ToolbarButton>

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        >
          •
        </ToolbarButton>

        <ToolbarButton
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        >
          1.
        </ToolbarButton>

        <label className="ml-1 flex h-9 items-center gap-2 border border-black/15 px-2 text-xs">
          Color

          <input
            type="color"
            value={
              editor.getAttributes('textStyle').color ||
              '#171512'
            }
            onChange={event =>
              editor
                .chain()
                .focus()
                .setColor(event.target.value)
                .run()
            }
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <ToolbarButton
          title="Reset color"
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetColor()
              .run()
          }
        >
          A
        </ToolbarButton>

        <div className="ml-auto flex gap-1">
          <ToolbarButton
            title="Undo"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() =>
              editor.chain().focus().undo().run()
            }
          >
            ↶
          </ToolbarButton>

          <ToolbarButton
            title="Redo"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() =>
              editor.chain().focus().redo().run()
            }
          >
            ↷
          </ToolbarButton>
        </div>
      </div>

      {!editor.getText().trim() && (
        <div className="pointer-events-none absolute left-0 top-[52px] px-5 py-4 text-base text-black/30">
          {placeholder}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}