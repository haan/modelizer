import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import MarkdownIt from 'markdown-it'
import { dialogStyles } from './dialogStyles.js'
import helpMarkdown from '../../content/help.md?raw'
import aboutMarkdown from '../../content/about.md?raw'

const markdown = new MarkdownIt({ breaks: true, linkify: true })
const helpHtml = markdown.render(helpMarkdown)
const aboutHtml = markdown.render(aboutMarkdown)
const markdownClass =
  'text-xs leading-relaxed text-base-content [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-xs [&_h3]:font-semibold [&_a]:text-primary [&_a]:underline'

export function HelpDialog({ open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} />
        <Dialog.Content
          className={`${dialogStyles.content} flex h-[70vh] w-[720px] max-w-[92vw] flex-col p-6`}
        >
          <Tabs.Root defaultValue="help" className="mt-4 flex min-h-0 flex-1 flex-col">
            <Tabs.List className="flex items-center gap-2 border-b border-base-content/10 pb-2">
              <Tabs.Trigger
                className="rounded-md px-2 py-1 text-xs font-semibold text-base-content/60 transition-colors hover:bg-base-200 data-[state=active]:text-base-content"
                value="help"
              >
                Help
              </Tabs.Trigger>
              <Tabs.Trigger
                className="rounded-md px-2 py-1 text-xs font-semibold text-base-content/60 transition-colors hover:bg-base-200 data-[state=active]:text-base-content"
                value="about"
              >
                About
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="help" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2">
              <div
                className={markdownClass}
                dangerouslySetInnerHTML={{ __html: helpHtml }}
              />
            </Tabs.Content>
            <Tabs.Content value="about" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2">
              <div
                className={markdownClass}
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            </Tabs.Content>
          </Tabs.Root>
          <div className={dialogStyles.actions}>
            <Dialog.Close className={dialogStyles.cancel}>Close</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
