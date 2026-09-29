import { PRIVACY_STATEMENT, PRIVACY_URL } from '@ligant/bench-chrome'
import { GuidancePin } from '../guidance/GuidancePin'

/**
 * The privacy disclosure: the suite's standard statement, word for word the
 * one in the footer, and the Privacy Policy it rests on.
 *
 * Both come from @ligant/bench-chrome, the source the footer renders from, so
 * the two places this page states its privacy terms cannot disagree, and no
 * Bench Tool can state different ones.
 */
export function PrivacyPanel() {
  return (
    <>
      <h3>
        Privacy
        <GuidancePin anchor="shared.privacy" />
      </h3>
      <p>{PRIVACY_STATEMENT}</p>
      <p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Privacy Policy
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
    </>
  )
}
