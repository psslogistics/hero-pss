"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type TrackingMode = "pssAwb" | "partnerAwb";
type TrackingSubmission = "idle" | "loading" | "success" | "invalid" | "notFound" | "unavailable";
type TrackingFormModel = { mode: TrackingMode; reference: string; submission: TrackingSubmission };
type PublicTrackingResult = { status?: string; edd?: string | null; delivered_at?: string | null; updated_at?: string | null; events?: Array<{ status?: string; location?: string; description?: string; event_time?: string }> };

const services = [
  ["01", "Air freight", "Time-critical cargo, precisely coordinated."],
  ["02", "Surface freight", "Reliable road movement, mile after mile."],
  ["03", "Train freight", "Flexible capacity for every kind of load."],
  ["04", "International", "Cross-border logistics without the friction."],
  ["05", "ATA freight", "Airport-to-airport, with every detail in view."],
];

const capabilities = ["Booking", "Tracking", "Pickup", "RTO / NDR", "Wallet & billing", "Reports & support"];

function Arrow() { return <span aria-hidden="true">↗</span>; }

function trackingLabel(result: PublicTrackingResult | null) {
  const status = String(result?.status ?? "").toLowerCase();
  if (status === "delivered") return "Delivered";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "delayed" || status === "exception") return "Delayed / exception";
  if (status === "rto") return "Return in progress";
  if (status === "booked" && !result?.events?.length) return "Provider update pending";
  if (status) return status.replaceAll("_", " ");
  return "Shipment located";
}

function TrackingCommand() {
  const [form, setForm] = useState<TrackingFormModel>({ mode: "pssAwb", reference: "", submission: "idle" });
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const setMode = (mode: TrackingMode) => setForm((current) => ({ ...current, mode, submission: "idle" }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reference = form.reference.trim();
    if (!reference) { setResult(null); setForm((current) => ({ ...current, submission: "invalid" })); return; }
    setForm((current) => ({ ...current, submission: "loading" }));
    const apiUrl = process.env.NEXT_PUBLIC_PSS_API_URL?.replace(/\/$/, "");
    if (!apiUrl) { setResult(null); setForm((current) => ({ ...current, submission: "unavailable" })); return; }
    void fetch(`${apiUrl}/public/track?reference=${encodeURIComponent(reference)}`)
      .then(async (response) => { if (!response.ok) throw new Error(`Tracking request failed with status ${response.status}`); return response.json() as Promise<{ data?: PublicTrackingResult | null }>; })
      .then((payload) => { setResult(payload.data ?? null); setForm((current) => ({ ...current, submission: payload.data ? "success" : "notFound" })); })
      .catch(() => { setResult(null); setForm((current) => ({ ...current, submission: "unavailable" })); });
  };
  return <div className="tracking-command" id="track">
    <div className="command-heading"><div><span className="orange-kicker">SHIPMENT VISIBILITY</span><h2>Where is it now?</h2></div><span className="portal-status"><i /> PSS PORTAL</span></div>
    <div className="mode-tabs" role="tablist" aria-label="Tracking reference type">{(["pssAwb", "partnerAwb"] as TrackingMode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={form.mode === mode} className={form.mode === mode ? "active" : ""} onClick={() => setMode(mode)}>{mode === "pssAwb" ? "PSS Logistics AWB" : "Partner AWB"}</button>)}</div>
    <form onSubmit={submit}><label htmlFor="tracking-reference">Enter your {form.mode === "pssAwb" ? "PSS AWB" : "partner reference No."}</label><div className="command-input"><input id="tracking-reference" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value, submission: "idle" }))} placeholder="Enter AWB or partner reference No." autoComplete="off" /><button type="submit" disabled={form.submission === "loading"}>{form.submission === "loading" ? "Checking…" : "Track"} <Arrow /></button></div></form>
    {form.submission === "invalid" && <p className="form-error" role="status">Enter a reference number to start tracking.</p>}
    {form.submission === "notFound" && <p className="form-error" role="status">We could not find that reference. Check the number and try again.</p>}
    {form.submission === "unavailable" && <p className="form-error" role="status">Live tracking is temporarily unavailable. Please try again shortly.</p>}
    {form.submission === "success" && <div className="demo-result" role="status" aria-live="polite"><span>LIVE RESULT · CURRENT STATUS</span><strong>{trackingLabel(result)} <b>·</b> Production tracking</strong><small>{result?.delivered_at ? `Delivered ${new Date(result.delivered_at).toLocaleDateString()}. ` : result?.edd ? `Expected delivery: ${new Date(result.edd).toLocaleDateString()}. ` : ""}{result?.events?.at(-1)?.location ? `Latest location: ${result.events.at(-1)?.location}. ` : "Provider event details are pending."}Sign in to view the complete event history and shipment details.</small></div>}
    <a className="full-track" href="https://client.psslogistics.in/dashboard/shipmentTracking">View full tracking details <Arrow /></a>
  </div>;
}

function ShipmentPreview() { return <div className="shipment-preview"><div className="preview-top"><span className="preview-logo"><b>PSS</b> LOGISTICS</span><span className="preview-menu">OVERVIEW &nbsp; TRACKING &nbsp; BILLING</span><span className="preview-dot" /></div><div className="preview-body"><div className="preview-copy"><span className="orange-kicker">LIVE MOVEMENT / 312200621</span><h2>Every handoff,<br /><em>in view.</em></h2><p>Shipment operations, status history, and next actions in one workspace.</p><div className="mini-route"><span>DEL</span><i /><span>BLR</span><i /><span>SIN</span></div></div><div className="route-map"><div className="map-grid" /><svg viewBox="0 0 430 230" fill="none"><path d="M22 198C102 164 93 50 190 82C276 111 259 197 405 30" stroke="#ff6b24" strokeWidth="2" strokeDasharray="5 7" /><circle cx="22" cy="198" r="6" fill="#ff6b24" /><circle cx="190" cy="82" r="6" fill="#d8ef75" /><circle cx="405" cy="30" r="6" fill="#ff6b24" /></svg><span className="map-origin">DELHI</span><span className="map-current">BENGALURU</span><span className="map-destination">SINGAPORE</span></div></div><div className="preview-bottom"><span>EST. DELIVERY <b>24 AUG 2026</b></span><span>STATUS <b className="lime-text">ON ROUTE</b></span><span>78% <b>COMPLETE</b></span></div></div>; }

export default function Home() {
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);
  const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "PSS Logistics", url: "https://psslogistics.in", logo: "https://psslogistics.in/brand/pss-logo.png", email: "hello@psslogistics.in", sameAs: ["https://client.psslogistics.in"] };
  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: "PSS Logistics shipping and shipment tracking", provider: { "@type": "Organization", name: "PSS Logistics", url: "https://psslogistics.in" }, serviceType: ["Freight forwarding", "Courier shipping", "Shipment tracking", "Pickup management"] };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "PSS Logistics", url: "https://psslogistics.in" };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
    { "@type": "Question", name: "Can I track a PSS Logistics shipment online?", acceptedAnswer: { "@type": "Answer", text: "Yes. Use the public tracking field with a PSS AWB or partner reference. Private shipment details remain available only after signing in." } },
    { "@type": "Question", name: "Which logistics services does PSS Logistics support?", acceptedAnswer: { "@type": "Answer", text: "PSS Logistics supports commercial freight, courier shipping, pickup coordination, shipment tracking, RTO and NDR operations, billing, reports, and support workflows." } },
  ] };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /><header className={`site-header${hasScrolled ? " is-scrolled" : ""}`}><a className="wordmark" href="#top"><Image src="/brand/pss-logo.png" alt="PSS Logistics — Direct to every direction" width={184} height={92} priority /></a><nav><a href="#services">Services</a><a href="#platform">Solutions</a><a href="#track">Track shipment</a><a href="#about">About</a></nav><div className="header-actions"><a href="https://client.psslogistics.in/sign-in">Sign in</a><a className="orange-button" href="https://client.psslogistics.in/sign-up">Start shipping <Arrow /></a></div></header>
    <section className="hero" id="top"><div className="hero-media"><div className="media-overlay" /><div className="hero-scanlines" /><div className="media-label">PSS / FREIGHT IN MOTION / 01</div><div className="media-caption"><span>DIRECT TO</span><strong>EVERY<br />DIRECTION</strong></div><div className="media-coordinates">28° 38′ N &nbsp; 77° 13′ E</div></div><div className="hero-content"><span className="orange-kicker">PSS LOGISTICS / MOVEMENT, MADE VISIBLE</span><h1>Move with<br /><em>direction.</em></h1><p>From first booking to final delivery, keep every shipment moving with clarity, control, and confidence.</p><div className="hero-buttons"><a className="orange-button" href="#start">Start shipping <Arrow /></a><a className="line-link" href="#platform">Explore solutions <Arrow /></a></div><div className="hero-tracker"><TrackingCommand /></div><div className="hero-meta"><span>01 — 04</span><span>COMMERCIAL / COURIER / GLOBAL</span><span>SCROLL TO DISCOVER ↓</span></div></div><div className="hero-ship-mark">✦</div></section>
    <div className="ticker"><div>BOOK <b>✦</b> MOVE <b>✦</b> TRACK <b>✦</b> RESOLVE <b>✦</b> RECONCILE <b>✦</b> BOOK <b>✦</b> MOVE <b>✦</b> TRACK <b>✦</b></div></div>
    <section className="manifest section-shell" id="about"><div className="manifest-intro"><span className="section-number">02 / THE MANIFEST</span><h2>Logistics is not<br /><em>just a destination.</em></h2></div><div className="manifest-copy"><p>It is every decision, handoff, and mile between here and there. PSS Logistics brings the entire movement into focus.</p><a className="line-link" href="#platform">Our approach <Arrow /></a></div></section>
    <section className="platform section-shell" id="platform"><div className="section-topline"><span className="section-number">03 / THE CONTROL ROOM</span><span>BUILT AROUND YOUR OPERATIONS</span></div><div className="preview-wrap"><ShipmentPreview /><div className="preview-side"><span className="orange-kicker">ONE WORKSPACE</span><h2>Control<br /><em>the move.</em></h2><p>Booking, tracking, pickup, RTO, billing, reports, and support—connected around the shipment.</p><div className="capability-list">{capabilities.map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong><Arrow /></div>)}</div></div></div></section>
    <section className="services" id="services"><div className="section-shell"><div className="section-topline"><span className="section-number">04 / THE NETWORK</span><span>ONE STANDARD, EVERY MODE</span></div><div className="services-heading"><h2>Every route<br /><em>has a rhythm.</em></h2><p>Commercial and courier logistics for the moments that cannot wait.</p></div><div className="service-list">{services.map(([number, title, text]) => <a className="service-row" href="#start" key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p><Arrow /></a>)}</div></div></section>
    <section className="tracking-proof section-shell"><div className="proof-head"><span className="orange-kicker">WHEN THE SHIPMENT MOVES</span><h2>Know the story<br /><em>behind the status.</em></h2></div><div className="proof-board"><div className="proof-board-top"><span>PSS AWB</span><strong>312200621</strong><b>IN TRANSIT</b></div><div className="proof-details"><div><small>CLIENT ORDER ID</small><strong>ORD-2026-0814</strong></div><div><small>ORDER DATE</small><strong>14 AUG 2026</strong></div><div><small>EST. DELIVERY</small><strong>24 AUG 2026</strong></div></div><div className="history"><div className="history-line" /><div><i className="done" /><span>Picked up</span><small>Delhi · 14 Aug</small></div><div><i className="done" /><span>In transit</span><small>Bengaluru · 18 Aug</small></div><div><i /><span>Out for delivery</span><small>Singapore · Pending</small></div></div><p className="demo-note">Illustrative route preview · use the live tracker above for production lookup.</p></div></section>
    <section className="rhythm"><div className="section-shell rhythm-inner"><span className="section-number">05 / THE RHYTHM</span><h2>Book. Move. Track.<br /><em>Keep going.</em></h2><div className="rhythm-steps">{[["01", "Book", "Start with the right details."], ["02", "Move", "Coordinate every handoff."], ["03", "Track", "See what is happening now."], ["04", "Resolve", "Act before exceptions grow."], ["05", "Reconcile", "Close the loop clearly."]].map(([number, title, text]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section className="final-cta section-shell" id="start"><div className="cta-image"><div className="cta-image-text">PSS<br /><span>LOGISTICS</span></div></div><div className="cta-copy"><span className="orange-kicker">DIRECT TO EVERY DIRECTION</span><h2>Ready to<br /><em>move?</em></h2><p>Build a clearer way to run your shipments.</p><a className="orange-button" href="https://client.psslogistics.in/sign-up">Start shipping <Arrow /></a><a className="line-link" href="https://client.psslogistics.in/sign-in">Track a shipment <Arrow /></a></div></section>
    <footer className="site-footer section-shell"><a className="footer-brand" href="#top"><Image src="/brand/pss-logo.png" alt="PSS Logistics" width={154} height={77} /></a><span>Operational clarity for every shipment.</span><div><a href="#services">Services</a><a href="#track">Track</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@psslogistics.in">Contact</a><a href="#top">Back to top ↑</a></div></footer></main>;
}
