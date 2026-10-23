import { useId, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import MarkdownIt from 'markdown-it'
import { dialogStyles } from './dialogStyles.js'
import helpMarkdown from '../../content/help.md?raw'
import aboutMarkdown from '../../content/about.md?raw'

const markdown = new MarkdownIt({ linkify: true })
markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  // Keep help links from navigating away from an unsaved model.
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return renderer.renderToken(tokens, index, options)
}

// Level-two headings define topics; keep the guide editable as Markdown.
function readSections(source) {
  const [intro, ...sections] = source.split(/^## /m)
  return {
    intro: markdown.render(intro),
    sections: sections.map((section, index) => {
      const lineEnd = section.indexOf('\n')
      return {
        id: `topic-${index}`,
        title: section.slice(0, lineEnd).trim(),
        html: markdown.render(section.slice(lineEnd + 1)),
      }
    }),
  }
}

const guide = readSections(helpMarkdown)
const about = readSections(aboutMarkdown)
const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base-100'

function MarkdownContent({ html, className = '' }) {
  // Bundled, trusted Markdown only; MarkdownIt leaves raw HTML disabled.
  return <div className={`help-prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}

function HelpGuide() {
  const [topicId, setTopicId] = useState(guide.sections[0].id)
  const headingId = useId()
  const topic = guide.sections.find(section => section.id === topicId)

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row">
      <nav aria-label="Help topics" className="hidden w-52 shrink-0 overflow-y-auto border-r border-base-content/10 bg-base-200/50 p-3 sm:block">
        <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-base-content/65">In this guide</p>
        {guide.sections.map(section => (
          <button
            key={section.id}
            type="button"
            aria-current={topicId === section.id ? 'page' : undefined}
            onClick={() => setTopicId(section.id)}
            className={`my-0.5 w-full rounded-md px-3 py-2 text-left text-sm leading-5 transition-colors hover:bg-base-200 aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-primary-label ${focusClass}`}
          >
            {section.title}
          </button>
        ))}
      </nav>
      <div className="shrink-0 border-b border-base-content/10 px-5 py-3 sm:hidden">
        <label className="mb-1 block text-xs font-medium" htmlFor={`${headingId}-select`}>Help topic</label>
        <select id={`${headingId}-select`} value={topicId} onChange={event => setTopicId(event.target.value)} className={`w-full rounded-md border border-base-content/20 bg-base-100 px-2 py-2 text-sm ${focusClass}`}>
          {guide.sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
        </select>
      </div>
      <article key={topicId} aria-labelledby={headingId} tabIndex={0} className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 ${focusClass}`}>
        <h2 id={headingId} className="mb-4 text-xl font-semibold tracking-tight">{topic.title}</h2>
        <MarkdownContent html={topic.html} />
      </article>
    </div>
  )
}

function AboutContent() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7" tabIndex={0}>
      <div className="mx-auto max-w-3xl">
        <MarkdownContent html={about.intro} className="help-about-intro" />
        <div className="mt-7 grid gap-5 md:grid-cols-[1.3fr_1fr]">
          {about.sections.map(section => (
            <section key={section.id} className="rounded-lg border border-base-content/10 bg-base-200/40 p-5">
              <h2 className="mb-3 text-base font-semibold">{section.title}</h2>
              <MarkdownContent html={section.html} />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HelpDialog({ open, onOpenChange, tab: controlledTab, onTabChange, onCloseAutoFocus }) {
  const titleRef = useRef(null)
  const [internalTab, setInternalTab] = useState('help')
  const tab = controlledTab ?? internalTab
  const setTab = onTabChange ?? setInternalTab
  const appVersion = typeof __APP_VERSION__ === 'string' ? `v${__APP_VERSION__}` : ''

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} />
        <Dialog.Content
          onOpenAutoFocus={event => {
            event.preventDefault()
            titleRef.current?.focus()
          }}
          onCloseAutoFocus={onCloseAutoFocus} className="fixed left-1/2 top-1/2 z-50 flex h-[min(760px,88dvh)] w-[940px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-base-content/20 bg-base-100 text-base-content shadow-xl">
          <header className="flex shrink-0 items-center gap-4 px-5 pb-5 pt-6 sm:px-7">
            <img src="/images/logo.svg" alt="" className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <Dialog.Title ref={titleRef} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">{tab === 'help' ? 'Modelizer help' : 'About Modelizer'}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-base-content/70">
                {tab === 'help' ? 'From your first class to a model ready to share.' : 'A database modeling tool for teaching and learning.'}
              </Dialog.Description>
            </div>
          </header>
          <Tabs.Root value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <Tabs.List aria-label="Help and about" className="flex shrink-0 gap-6 border-b border-base-content/10 px-5 sm:px-7">
              {['help', 'about'].map(value => (
                <Tabs.Trigger key={value} value={value} className={`border-b-2 border-transparent px-1 pb-3 pt-1 text-sm font-medium text-base-content/70 transition-colors hover:text-base-content data-[state=active]:border-primary data-[state=active]:text-base-content ${focusClass}`}>
                  {value === 'help' ? 'Help' : 'About'}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="help" className="min-h-0 flex-1 data-[state=inactive]:hidden">
              <HelpGuide />
            </Tabs.Content>
            <Tabs.Content value="about" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
              <AboutContent />
            </Tabs.Content>
          </Tabs.Root>
          <footer className="flex shrink-0 items-center justify-between border-t border-base-content/10 px-5 py-3 sm:px-7">
            <span className="text-xs text-base-content/65">Modelizer {appVersion}</span>
            <Dialog.Close className={`${dialogStyles.cancel} ${focusClass}`}>Close</Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
