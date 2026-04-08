import Link from "next/link"

export function SlaBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">SLA: Service Level Agreement</h1>
        <p className="text-muted-foreground">
          Annex 1: PitStop platform (digital services)
          <br />
          Version 1.1: Last updated: 5 April 2026
          <br />
          Scope: this annex is binding in the context of PitStop GTS (customers) and GPT (garages). It constitutes an obligation
          of means.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Purpose and legal nature</h2>
        <p className="text-muted-foreground">
          This Service Level Agreement (hereinafter “SLA”) defines the target service levels of the PitStop platform regarding
          availability, incident management, maintenance and communication.
        </p>
        <p className="text-muted-foreground">
          The SLA constitutes an <span className="font-medium text-foreground">obligation of means</span> within the meaning of
          Belgian law on obligations (Article 5:71 of the new Belgian Civil Code). It cannot be characterised as a warranty of
          result. PitStop cannot be held liable for interruptions or degradation of service resulting from causes outside its
          reasonable control.
        </p>
        <p className="text-muted-foreground">
          The service levels defined below apply to the production version of the platform. During the restricted testing (beta)
          phase, they are provided for information only and without enforceable contractual commitment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Functional scope covered</h2>
        <p className="text-muted-foreground">The SLA covers the technical availability of the following functions:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>browsing public PitStop pages;</li>
          <li>authentication, user account management, credit management;</li>
          <li>AI-assisted diagnostic journey;</li>
          <li>appointment booking journey with deposit;</li>
          <li>internal APIs required for application operation.</li>
        </ul>
        <p className="text-muted-foreground">The following are expressly excluded from the scope of obligations of result:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>availability of third-party infrastructure (Stripe, Vercel, Turso, Anthropic, DNS, mobile network/operator, etc.);</li>
          <li>interruptions caused by an event of force majeure within the meaning of Belgian law;</li>
          <li>unavailability resulting from external malicious actions (DDoS attacks, intrusions, etc.);</li>
          <li>unavailability due to misconfiguration or non-compliant use on the user side;</li>
          <li>features being deployed or in beta testing.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Target availability</h2>
        <p className="text-muted-foreground">
          3.1 The monthly target availability of the platform is set at{" "}
          <span className="font-medium text-foreground">99.5%</span> (obligation of means).
        </p>
        <p className="text-muted-foreground">3.2 Availability is calculated per calendar month using the following formula:</p>
        <p className="text-muted-foreground pl-4 border-l-2 border-border italic">
          Availability (%) = ((Total duration of the month - Duration of attributable unavailability) / Total duration of the month)
          × 100
        </p>
        <p className="text-muted-foreground">
          3.3 Excluded from the unavailability calculation are: announced scheduled maintenance windows, incidents attributable to
          third-party providers, and cases of force majeure.
        </p>
        <p className="text-muted-foreground">
          3.4 If target availability is not met for reasons attributable to PitStop, the user may send a complaint to{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          . No automatic financial compensation is provided during the testing phase.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Maintenance management</h2>
        <div>
          <h3 className="font-medium text-foreground">4.1 Scheduled maintenance</h3>
          <p className="text-muted-foreground">
            PitStop may perform scheduled maintenance (corrective, preventive or evolutionary). Unless urgent, prior notice is given
            to users via the platform or any appropriate channel, within a reasonable time before the intervention.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">4.2 Emergency maintenance</h3>
          <p className="text-muted-foreground">
            In case of confirmed security vulnerability, risk of corruption or data loss, or critical unavailability affecting the
            integrity of the service or user data, PitStop reserves the right to intervene without prior notice. Post-intervention
            communication will be provided within a reasonable time.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">4.3 Preferred maintenance windows</h3>
          <p className="text-muted-foreground">
            Where possible, scheduled maintenance is planned outside peak usage hours (preferably night or weekend). This rule is
            not enforceable against PitStop in case of technical emergency.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Incident classification and triage</h2>
        <p className="text-muted-foreground">Incidents are classified according to their functional impact on users:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">P1 — Critical:</span> complete unavailability of the main service,
            inability to make a payment or run a diagnostic, widespread blocking failure affecting all users.
          </li>
          <li>
            <span className="font-medium text-foreground">P2 — Major:</span> core functionality unavailable or severely degraded
            for a significant proportion of users; difficult or impossible workaround.
          </li>
          <li>
            <span className="font-medium text-foreground">P3 — Minor:</span> non-blocking degradation of a secondary feature,
            with possible workaround; limited impact on user experience.
          </li>
          <li>
            <span className="font-medium text-foreground">P4 — Cosmetic / Enhancement:</span> visual defect without functional
            impact, or non-urgent improvement request.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Priority classification of an incident is solely for PitStop to assess, based on technical information available at the
          time of identification.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Target response times (obligation of means)</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>P1: target acknowledgement within 1 hour of detection or report;</li>
          <li>P2: target acknowledgement within 4 hours;</li>
          <li>P3: target acknowledgement within 1 business day;</li>
          <li>P4: added to the maintenance backlog with no guaranteed timeline.</li>
        </ul>
        <p className="text-muted-foreground">
          These times relate to acknowledgement (receipt and start of investigation), not resolution. Resolution times depend on
          the nature of the root cause, technical complexity, and any dependencies on third-party providers. PitStop cannot guarantee
          a defined resolution time for any incident category.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">7. Communication during an incident</h2>
        <p className="text-muted-foreground">
          7.1 For any P1 or P2 incident, PitStop undertakes to communicate within a reasonable time the following information:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>nature and scope of the incident;</li>
          <li>known functional impacts;</li>
          <li>remediation actions taken;</li>
          <li>progress status towards normal service.</li>
        </ul>
        <p className="text-muted-foreground">
          7.2 Communication is via notification on the platform or any other channel PitStop deems appropriate. Registered users may
          also be contacted by email for P1 incidents lasting more than 4 hours.
        </p>
        <p className="text-muted-foreground">
          7.3 For P3 and P4 incidents, no proactive individual communication is guaranteed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">8. Operational security</h2>
        <p className="text-muted-foreground">
          PitStop implements, within the limits of its technical means, the following operational security measures:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>logging of sensitive events (authentication, payments, administrative operations);</li>
          <li>enhanced administrative access controls (owner email restriction, request origin verification);</li>
          <li>anti-replay protections on critical payment flows (Stripe webhook idempotency);</li>
          <li>consistency and capping controls on sensitive operations (credit grants, user roles);</li>
          <li>password encryption using scrypt and session token hashing using SHA-256.</li>
        </ul>
        <p className="text-muted-foreground">
          These measures represent reasonable security effort and cannot be interpreted as an absolute guarantee against intrusion
          or data breach.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">9. Backup, logging and evidence retention</h2>
        <p className="text-muted-foreground">9.1 PitStop retains technical logs covering:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>diagnostic and payment operations, for contractual evidence purposes;</li>
          <li>sensitive security events (login attempts, administrative operations);</li>
          <li>technical incident events for diagnostic purposes.</li>
        </ul>
        <p className="text-muted-foreground">
          9.2 These logs are kept for the time necessary to defend the parties&apos; rights, in compliance with the privacy policy
          and applicable regulations (GDPR, Belgian law).
        </p>
        <p className="text-muted-foreground">
          9.3 In case of dispute, technical logs from PitStop and its providers (in particular Stripe and Turso) are binding unless
          proven otherwise, in accordance with Article 19 of the GTS.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">10. User reporting of an incident</h2>
        <p className="text-muted-foreground">
          10.1 Any user who notices an anomaly or unavailability may report it to:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          .
        </p>
        <p className="text-muted-foreground">The report must specify:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>the affected functionality;</li>
          <li>date and time observed;</li>
          <li>browser and device used;</li>
          <li>a precise description of observed behaviour;</li>
          <li>any screenshot or other useful information.</li>
        </ul>
        <p className="text-muted-foreground">
          10.2 A user report does not predetermine PitStop&apos;s classification of the incident or application of the timelines in
          Article 6.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">11. Liability limits and exclusions</h2>
        <p className="text-muted-foreground">
          11.1 This SLA is an obligation of means. PitStop assumes no obligation of result as to continuous availability of the
          platform.
        </p>
        <p className="text-muted-foreground">11.2 PitStop&apos;s liability under this SLA is excluded in the following cases:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>unavailability of a third-party provider outside PitStop&apos;s control;</li>
          <li>force majeure within the meaning of Belgian law;</li>
          <li>non-compliant use of the platform by the user;</li>
          <li>external malicious actions (cyberattacks, etc.);</li>
          <li>user failure to meet technical prerequisites for accessing the service.</li>
        </ul>
        <p className="text-muted-foreground">
          11.3 In no event shall PitStop be liable for indirect damage, loss of business, data loss or non-material harm resulting
          from unavailability, except where mandatory law applicable to Belgian consumer law provides otherwise.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">12. SLA revision</h2>
        <p className="text-muted-foreground">
          12.1 PitStop reserves the right to amend this SLA at any time, for technical, legal or security reasons.
        </p>
        <p className="text-muted-foreground">
          12.2 The binding version is that published on the platform on the date the relevant incident or dispute arises.
        </p>
        <p className="text-muted-foreground">
          12.3 Material changes affecting service levels will be notified in advance to registered users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">13. Applicable law and jurisdiction</h2>
        <p className="text-muted-foreground">
          This SLA is governed by Belgian law. Any dispute relating to its interpretation or performance falls within the
          jurisdiction of the courts of the arrondissement of Nivelles, without prejudice to mandatory rules protecting consumers
          applicable in Belgium.
        </p>
      </section>

      <div className="pt-2">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}
