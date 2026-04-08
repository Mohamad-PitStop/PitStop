import Link from "next/link"

export function CgvBodyEn() {
  return (
    <div className="container mx-auto max-w-4xl px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">General terms of sale (B2C)</h1>
        <p className="text-muted-foreground">
          PitStop: Private customers (Belgium)
          <br />
          Version 1.2: Last updated: 5 April 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 1: Identification of the publisher</h2>
        <p className="text-muted-foreground">These General Terms of Sale (hereinafter “GTS”) are published by:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Last name: Ali Ahmad</li>
          <li>First name: Mohamad</li>
          <li>Status: natural person; activity carried on in own name, with no registered business structure at this stage</li>
          <li>BCE number: not applicable (no BCE registration to date)</li>
          <li>VAT number: not applicable (activity not subject to VAT at this stage)</li>
          <li>
            Contact:{" "}
            <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
              pitstopbelgique@gmail.com
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">Hereinafter referred to as “PitStop”.</p>
        <p className="text-muted-foreground">
          This information (BCE number, VAT number, legal form) will be updated when official commercial operations begin.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 2: Purpose and scope</h2>
        <p className="text-muted-foreground">
          2.1 These GTS govern the contractual relationship between PitStop and any user acting as a consumer (hereinafter
          “Customer”), for the following services:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>AI-assisted automotive diagnostics;</li>
          <li>purchase of diagnostic credits;</li>
          <li>introduction to a partner garage;</li>
          <li>garage appointment booking with a deposit.</li>
        </ul>
        <p className="text-muted-foreground">
          2.2 These GTS apply exclusively to customers located in Belgium.
          <br />
          2.3 Purchase of diagnostic credits is offered online on the Platform (“Credits” page), with secure card payment via
          Stripe, subject to prior acceptance of these GTS. The “Sale” journey (trade-in value estimate with partner garages)
          may be deployed separately.
          <br />
          2.4 Any order, credit purchase, booking or use of the platform implies full and unreserved acceptance of these GTS.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 3: Definitions</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Platform: the PitStop website and digital interfaces;</li>
          <li>Diagnostic: estimate and guidance provided by PitStop based on information declared by the Customer;</li>
          <li>Credit: consumption unit granting access to one diagnostic;</li>
          <li>Partner garage: independent professional listed on the platform;</li>
          <li>Selected garage: the partner garage designated by the Customer when booking;</li>
          <li>Deposit: amount of EUR 25 paid when booking an appointment;</li>
          <li>
            Deposit escrow: the deposit is collected via a payment provider (Stripe) and tracked on PitStop&apos;s side for
            manual payout to the Selected garage as described below, without using Stripe Connect on the garage&apos;s behalf.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 4: Nature of the PitStop service</h2>
        <p className="text-muted-foreground">
          4.1 PitStop is a digital intermediary for transparency and guidance between the Customer and partner garages.
          <br />
          4.2 PitStop does not directly perform mechanical, bodywork, maintenance or repair work. The partner garage remains
          the sole performing contractor.
          <br />
          4.3 Information provided by PitStop is intended to help the Customer understand likely cost ranges and technical
          scenarios, without replacing physical inspection of the vehicle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 5: Prices and VAT</h2>
        <p className="text-muted-foreground">
          5.1 Unless otherwise stated, prices shown to the Customer are in EUR including VAT.
          <br />
          5.2 Internet connection, communications or any external costs related to use of the platform remain at the
          Customer&apos;s expense.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Article 6: Diagnostic credits: operation, validity, no refund
        </h2>
        <p className="text-muted-foreground">
          6.0 Offers (number of credits per pack, price in EUR incl. VAT, any promotions) are shown on the “Credits” page at
          checkout. The price and composition of the pack chosen by the Customer are binding at payment confirmation.
        </p>
        <p className="text-muted-foreground">
          6.1 1 credit = 1 full automotive diagnostic on the platform, including any follow-up questions in the diagnostic
          flow.
        </p>
        <p className="text-muted-foreground">6.2 Purchased credits are:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>valid indefinitely;</li>
          <li>non-transferable between accounts;</li>
          <li>non-refundable, except as provided in Article 12.5.</li>
        </ul>
        <p className="text-muted-foreground">
          6.3 If the Customer voluntarily deletes their account, remaining credits are permanently forfeited without refund.
          <br />
          6.4 If the account is suspended/closed for fraud, abuse or serious breach, remaining credits are permanently
          forfeited without refund.
          <br />
          6.5 “No issue” case: when a diagnostic explicitly concludes that no intervention is required (according to the
          platform&apos;s functional logic), the credit used is re-credited to the Customer.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 7: Payment</h2>
        <p className="text-muted-foreground">
          7.1 Payments are processed via Stripe.
          <br />
          7.2 Available payment methods are those offered by Stripe at the time of the transaction.
          <br />
          7.3 The Customer warrants that they are authorised to use the selected payment method.
          <br />
          7.4 PitStop does not store full card data; such data is processed by the payment provider under its own terms.
          <br />
          7.5 When paying the deposit for a booking, the Customer is informed that cancellation and deposit retention rules are
          those in Article 10 of these GTS (12 h / 1 h windows, no-show, etc.).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 8: Withdrawal (digital content/services)</h2>
        <p className="text-muted-foreground">
          8.1 The Customer acknowledges that purchasing credits constitutes supply of a digital content/service performed
          immediately after confirmation.
        </p>
        <p className="text-muted-foreground">8.2 By confirming the order, the Customer:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>expressly requests immediate performance;</li>
          <li>acknowledges losing the right of withdrawal as soon as performance begins.</li>
        </ul>
        <p className="text-muted-foreground">
          8.3 This clause applies within the limits of Belgian law and mandatory consumer-protection provisions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 9: Appointment booking and deposit</h2>
        <p className="text-muted-foreground">
          9.1 A deposit is mandatory for booking an appointment via the platform.
          <br />
          9.2 The deposit amount is fixed: EUR 25.
          <br />
          9.3 In principle, the deposit is deducted from the garage&apos;s final invoice.
          <br />
          9.4 The garage may retain the deposit in the cases set out in Articles 10.2 to 10.5 and, where applicable, when
          justified preparation costs have been incurred.
          <br />
          9.5 The deposit is allocated to the booking and the Selected garage. It is managed through an internal escrow-style
          process (database tracking): PitStop does not automatically transfer funds to the garage&apos;s bank account via
          Stripe Connect; payout to the garage is by manual bank transfer to the professional IBAN declared by the garage,
          subject to processing statuses and cancellations/refunds under these GTS.
          <br />
          9.6 If the Customer receives a full refund in line with Article 10 (or an amicable decision), the corresponding
          claim of the Selected garage on that deposit is deemed extinguished or adjusted accordingly.
          <br />
          9.7 Actual refund times to the original payment method depend on the payment provider and card issuer; any timelines
          communicated to the Customer (e.g. 5–10 business days) are indicative.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Article 10: Cancellation, lateness, no-show</h2>
        <p className="text-muted-foreground">
          The following constitute prima facie evidence in a dispute relating to a booking: platform timestamps, status
          histories, application logs, Stripe transaction confirmations, written customer/garage exchanges, garage evidence
          (parts orders, physical preparation, etc.).
        </p>
        <div>
          <h3 className="font-medium text-foreground">10.1 Cancellation more than 12 hours before the appointment</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Evidence: cancellation timestamp compared to appointment time.</li>
            <li>Effect: online cancellation possible; automatic refund of the deposit.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.2 Cancellation between 12 hours and 1 hour before the appointment</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Evidence: inability to cancel online + direct contact with the garage.</li>
            <li>
              Effect: online cancellation unavailable; the Customer must contact the garage directly. Any refund of the
              deposit depends on the agreement with the garage; PitStop may facilitate mediation.
            </li>
            <li>
              In addition, the Selected garage may, from its PitStop professional area and with the Customer&apos;s agreement,
              record a cancellation that leads to refund of the deposit where payment tools allow.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.3 Cancellation less than 1 hour before the appointment</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Evidence: cancellation/notification timestamp.</li>
            <li>Effect: the deposit is automatically retained.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.4 No-show (delay ≥ 15 minutes without notice)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Evidence: appointment time + no notice + garage confirmation.</li>
            <li>Effect: the deposit is automatically retained.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-foreground">10.5 Delay more than 15 minutes with notice to the garage</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Evidence: record of call/message + time.</li>
            <li>
              Effect: the Customer must inform the garage. The deposit is retained. If the garage nevertheless agrees to carry
              out the inspection/work, the deposit will not be deducted from the final invoice.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 11: Estimates, quotes and physical inspection caveat</h2>
        <p className="text-muted-foreground">
          11.1 PitStop estimates are indicative.
          <br />
          11.2 They are based on information provided by the Customer, Belgian market benchmarks and technical databases fed by
          professionals.
          <br />
          11.3 The garage&apos;s final quote may change, in particular if major technical issues are discovered during physical
          inspection of the vehicle.
          <br />
          11.4 The Customer acknowledges that remote diagnostic is comparable to a technical pre-check without direct visual
          or mechanical inspection of the vehicle.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Article 12: Complaints and adjustments</h2>
        <p className="text-muted-foreground">
          12.1 Any complaint must be sent to:{" "}
          <a className="text-primary hover:underline" href="mailto:pitstopbelgique@gmail.com">
            pitstopbelgique@gmail.com
          </a>
          .
        </p>
        <p className="text-muted-foreground">12.2 The complaint must include at least:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>identity of the claimant;</li>
          <li>email used on the platform;</li>
          <li>appointment or transaction reference;</li>
          <li>date and time of the appointment (if applicable);</li>
          <li>precise description of the dispute;</li>
          <li>available supporting documents (screenshots, confirmations, etc.).</li>
        </ul>
        <p className="text-muted-foreground">12.3 Handling process:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">Receipt &amp; triage</span>: PitStop logs the request and classifies
            the dispute (payment, deposit, no-show, cancellation, quote variance, etc.).
          </li>
          <li>
            <span className="font-medium text-foreground">Contradictory review</span>: if a garage is involved, PitStop may
            collect its material (timeline, evidence, contact records, etc.).
          </li>
          <li>
            <span className="font-medium text-foreground">Reasoned decision</span>: confirmation of the rule applied, full or
            partial adjustment, or amicable proposal.
          </li>
          <li>
            <span className="font-medium text-foreground">Closure</span>: the file is closed with retention of evidence as
            required by applicable law.
          </li>
        </ul>
        <p className="text-muted-foreground">
          12.4 In the event of a proven technical error attributable to the platform (duplicate charge, debit anomaly, etc.),
          PitStop may make an adjustment (refund or re-credit).
          <br />
          12.5 Non-refundability of credits (Article 6) does not exclude correction for a proven technical error.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 13: Customer obligations</h2>
        <p className="text-muted-foreground">The Customer undertakes to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>provide accurate, complete and fair information;</li>
          <li>not use the platform for fraudulent purposes;</li>
          <li>not disrupt the technical operation of the service;</li>
          <li>respect the rights of PitStop, garages and third parties.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 14: Service availability</h2>
        <p className="text-muted-foreground">
          14.1 PitStop makes reasonable efforts to keep the platform available.
          <br />
          14.2 Temporary interruptions may occur (maintenance, security, incident, update).
          <br />
          14.3 PitStop is not liable for unavailability due to third parties (hosting, payments, network operator, force
          majeure, etc.).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 15: Intellectual property</h2>
        <p className="text-muted-foreground">
          15.1 The platform, its content, trademarks, interfaces, texts, graphics, databases and distinctive elements are
          protected.
          <br />
          15.2 Unless prior written authorisation is given, any reproduction, extraction, adaptation or exploitation is
          prohibited.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 16: Liability</h2>
        <p className="text-muted-foreground">
          16.1 PitStop owes a duty of means in providing its digital services.
          <br />
          16.2 PitStop is not liable for the physical performance of repairs, which is exclusively the partner garage&apos;s
          responsibility.
          <br />
          16.3 The Customer remains responsible for their statements, appointment choices and decisions based on estimates.
          <br />
          16.4 Indirect damage, loss of business, loss of opportunity or consequential non-material harm cannot be imputed
          to PitStop unless mandatory law provides otherwise.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 17: Personal data</h2>
        <p className="text-muted-foreground">
          Processing of personal data is governed by PitStop&apos;s{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Privacy policy
          </Link>
          , available on the platform. The Customer acknowledges having read it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 18: Suspension / account closure</h2>
        <p className="text-muted-foreground">
          18.1 PitStop may suspend or close an account in case of fraud, abuse, malicious use, breach of the GTS or legal
          obligation.
          <br />
          18.2 Such closure may result in loss of remaining credits without refund.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 19: Electronic evidence</h2>
        <p className="text-muted-foreground">
          Computer records, technical logs, transaction confirmations and timestamps from PitStop and/or its providers
          (including payments) are binding between the parties unless proven otherwise.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 20: Force majeure</h2>
        <p className="text-muted-foreground">
          PitStop is not liable for delay or non-performance caused by an event of force majeure within the meaning of Belgian
          law and case law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 21: Partial invalidity</h2>
        <p className="text-muted-foreground">
          If a clause is held void or unenforceable, the remaining provisions remain fully in force.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 22: No waiver</h2>
        <p className="text-muted-foreground">
          PitStop&apos;s failure to invoke a clause on one occasion does not constitute a permanent waiver of the right to
          invoke it later.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 23: Amendment of the GTS</h2>
        <p className="text-muted-foreground">
          PitStop may amend these GTS at any time. The binding version is that in force on the date of the relevant act
          (purchase, booking, use).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Article 24: Applicable law and jurisdiction</h2>
        <p className="text-muted-foreground">
          24.1 These GTS are governed by Belgian law.
          <br />
          24.2 Any dispute falls within the material jurisdiction of the courts of the arrondissement of Nivelles, without
          prejudice to mandatory rules protecting consumers.
          <br />
          24.3 The Customer may also use the European online dispute resolution platform:{" "}
          <a className="text-primary hover:underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
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
