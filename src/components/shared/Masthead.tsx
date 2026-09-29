import type { ReactNode } from 'react'
import { LigantLockup } from '../LigantMark'
import { TOOLS, TOOL_PATH, LIGANT_URL, absoluteUrl } from '../../lib/site'

/**
 * The page's identity, and the way out of it.
 *
 * The same masthead as the Antibody Titration Planner's, so the suite reads as
 * one site whichever tool a reader lands on. The current tool is a `span`
 * rather than an `a`: there is no link to the page you are already on, and the
 * stylesheet matches on the attribute rather than the element for exactly that
 * reason.
 *
 * SIBLING LINKS ARE ABSOLUTE, not root-relative, and that is deliberate: this
 * page is reachable at more than one origin (the router's
 * benchtools.ligant.ai and the Pages project's own *.pages.dev), and a
 * root-relative `/molarity-converter/` resolves against whichever origin the
 * reader is actually on. From the router that is correct; from the raw Pages
 * origin it 404s, because that path does not exist on THIS tool's own
 * project. `absoluteUrl` pins every sibling link to the one address the
 * suite is actually served from, regardless of which origin this page was
 * reached through.
 *
 * These links are a convenience for a reader, not a dependency: nothing on
 * this page loads from them, and the tool works with every one of them broken.
 *
 * TWO MORE LINKS, one level up each: the Ligant lockup goes to `ligant.ai`,
 * the parent site, and "Bench Tools" goes to the suite's own root
 * (`absoluteUrl('/')`, not a bare `/`, for the same reason the sibling links
 * are absolute). Neither is a tool switch, so neither belongs in the `ul` or
 * gets an `aria-current` treatment; they are a way out to the level above
 * this page, not a way sideways to a peer of it.
 */
interface Props {
  title: string
  children: ReactNode
}

export function Masthead({ title, children }: Props) {
  return (
    <header className="masthead">
      <div>
        <a href={LIGANT_URL} className="lockup-link">
          <LigantLockup />
        </a>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      <div className="tool-nav">
        <ul>
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              {tool.path === TOOL_PATH ? (
                <span aria-current="page">{tool.name}</span>
              ) : (
                <a href={absoluteUrl(tool.path)}>{tool.name}</a>
              )}
            </li>
          ))}
        </ul>
        <a href={absoluteUrl('/')} className="eyebrow suite-mark">
          Bench Tools
        </a>
      </div>
    </header>
  )
}
