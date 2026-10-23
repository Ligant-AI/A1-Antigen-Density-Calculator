import { SEO } from '../lib/seo';
export function Faq() {
    return (<section className="panel faq-panel" aria-labelledby="faq-heading">
      <div className="panel-head">
        <div className="titles">
          <h2 id="faq-heading">{SEO.faqHeading}</h2>
        </div>
      </div>
      <div className="panel-body">
        {SEO.faq.map(({ q, a }) => (<div key={q}>
            <h3>{q}</h3>
            <p>{a}</p>
          </div>))}
      </div>
    </section>);
}
