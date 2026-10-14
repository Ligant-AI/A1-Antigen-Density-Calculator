import { PRIVACY_STATEMENT, PRIVACY_URL } from '@ligant/bench-chrome';
import { GuidancePin } from '../guidance/GuidancePin';
export function PrivacyPanel() {
    return (<>
      <h3>
        Privacy
        <GuidancePin anchor="shared.privacy"/>
      </h3>
      <p>{PRIVACY_STATEMENT}</p>
      <p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Privacy Policy
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
    </>);
}
