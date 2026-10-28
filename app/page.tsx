"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

type TrackingMode = "pssAwb" | "partnerAwb";
type TrackingSubmission = "idle" | "loading" | "success" | "invalid" | "notFound" | "unavailable";
type PublicTrackingResult = { provider?: string; status?: string; edd?: string | null; delivered_at?: string | null; updated_at?: string | null; events?: Array<{ status?: string; location?: string; description?: string; event_time?: string }> };
type PublicTrackingPayload = { data?: PublicTrackingResult | null; status?: "found" | "not_found" | "provider_unavailable" };

const trackingCache = new Map<string, { payload: PublicTrackingPayload; expiresAt: number }>();
const trackingInFlight = new Map<string, Promise<PublicTrackingPayload>>();
const TRACKING_CACHE_TTL_MS = 15_000;

const lifecycle = [
  ["01", "Booked", "The right details start the move."],
  ["02", "Manifested", "A provider reference makes the handoff real."],
  ["03", "In transit", "Milestones and ETA stay connected."],
  ["04", "Resolved", "Exceptions become the next action."],
] as const;

const services = [
  ["01", "Book", "Create a shipment without losing the detail."],
  ["02", "Move", "Coordinate the handoffs that keep freight moving."],
  ["03", "Track", "Find the LR, the ETA, and the next signal."],
  ["04", "Resolve", "Turn an exception into a decision."],
  ["05", "Reconcile", "Close the operational and commercial loop."],
] as const;

const panelSnapshots = [
  { image: "/panel-previews/booking.png", label: "BOOKING", title: "Start with the details that matter.", alt: "PSS Logistics booking panel showing shipment details and documentation fields" },
  { image: "/panel-previews/tracking.png", label: "TRACKING", title: "See the shipment after the handoff.", alt: "PSS Logistics tracking panel showing LR, AWB, shipment status, and ready-to-ship details" },
  { image: "/panel-previews/operations.png", label: "OPERATIONS", title: "Keep the whole network in view.", alt: "PSS Logistics operations dashboard showing shipment KPIs and alerts" },
] as const;

function Arrow() { return <span aria-hidden="true">↗</span>; }

function trackingLabel(result: PublicTrackingResult | null) {
  const status = String(result?.status ?? "").toLowerCase();
  if (status === "delivered") return "Delivered";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "delayed" || status === "exception") return "Delayed / exception";
  if (status === "rto") return "Return in progress";
  if (status === "booked" && !result?.events?.length) return "Provider update pending";
  return status ? status.replaceAll("_", " ") : "Shipment located";
}

function TrackingCommand() {
  const [mode, setMode] = useState<TrackingMode>("pssAwb");
  const [reference, setReference] = useState("");
  const [submission, setSubmission] = useState<TrackingSubmission>("idle");
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const requestRef = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  useEffect(() => () => requestRef.current.controller?.abort(), []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) { setResult(null); setSubmission("invalid"); return; }
    const apiUrl = process.env.NEXT_PUBLIC_PSS_API_URL?.replace(/\/$/, "");
    if (!apiUrl) { setResult(null); setSubmission("unavailable"); return; }
    requestRef.current.controller?.abort();
    const requestId = ++requestRef.current.id;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    requestRef.current.controller = controller;
    const key = trimmed.toUpperCase();
    const cached = trackingCache.get(key);
    const request = cached && cached.expiresAt > Date.now()
      ? Promise.resolve(cached.payload)
      : trackingInFlight.get(key) ?? fetch(`${apiUrl}/public/track?reference=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => { if (!response.ok) throw new Error(`Tracking request failed with status ${response.status}`); return response.json() as Promise<PublicTrackingPayload>; })
        .then((payload) => { trackingCache.set(key, { payload, expiresAt: Date.now() + TRACKING_CACHE_TTL_MS }); return payload; })
        .finally(() => trackingInFlight.delete(key));
    if (!cached || cached.expiresAt <= Date.now()) trackingInFlight.set(key, request);
    setSubmission("loading");
    void request.then((payload) => {
      if (controller.signal.aborted || requestId !== requestRef.current.id) return;
      setResult(payload.data ?? null);
      setSubmission(payload.data ? "success" : payload.status === "provider_unavailable" ? "unavailable" : "notFound");
    }).catch(() => { if (requestId === requestRef.current.id) { setResult(null); setSubmission("unavailable"); } }).finally(() => window.clearTimeout(timeout));
  };

  return <section className="command-dock" id="track" aria-labelledby="track-title">
    <div className="command-dock-head"><div><span className="overline lime">PUBLIC TRACKING</span><h2 id="track-title">Where is it now?</h2></div><span className="online-mark"><i /> PSS PORTAL</span></div>
    <div className="command-tabs" role="tablist" aria-label="Tracking reference type">
      <button type="button" role="tab" aria-selected={mode === "pssAwb"} className={mode === "pssAwb" ? "is-active" : ""} onClick={() => { setMode("pssAwb"); setSubmission("idle"); }}>PSS Logistics AWB</button>
      <button type="button" role="tab" aria-selected={mode === "partnerAwb"} className={mode === "partnerAwb" ? "is-active" : ""} onClick={() => { setMode("partnerAwb"); setSubmission("idle"); }}>Partner reference</button>
    </div>
    <form onSubmit={submit}><label htmlFor="tracking-reference">Enter {mode === "pssAwb" ? "your PSS AWB" : "a partner reference"}</label><div className="command-field"><input id="tracking-reference" value={reference} onChange={(event) => { setReference(event.target.value); setSubmission("idle"); }} placeholder="AWB / LR / reference number" autoComplete="off" /><button type="submit" disabled={submission === "loading"}>{submission === "loading" ? "Checking…" : "Track"} <Arrow /></button></div></form>
    {submission === "invalid" && <p className="command-error" role="status">Enter a reference number to start tracking.</p>}
    {submission === "notFound" && <p className="command-error" role="status">We could not find that reference. Check the number and try again.</p>}
    {submission === "unavailable" && <p className="command-error" role="status">Live tracking is temporarily unavailable. Please try again shortly.</p>}
    {submission === "success" && <div className="command-result" role="status" aria-live="polite"><span>LIVE RESULT · CURRENT STATUS</span><strong>{trackingLabel(result)} <b>·</b> {result?.provider ? `${result.provider} tracking` : "PSS tracking"}</strong><small>{result?.edd ? `Expected delivery: ${new Date(result.edd).toLocaleDateString()}. ` : ""}{result?.events?.at(-1)?.location ? `Latest location: ${result.events.at(-1)?.location}.` : "Provider event details are pending."}</small></div>}
    <a className="text-link" href="https://client.psslogistics.in/dashboard/shipmentTracking">View full tracking details <Arrow /></a>
  </section>;
}

function RouteField() {
  return <div className="route-field" aria-label="Illustrated shipment route from origin to destination">
    <div className="route-field-grid" />
    <svg viewBox="0 0 740 520" role="img" aria-label="A live route line crossing a logistics network">
      <defs><linearGradient id="route-glow" x1="0" x2="1"><stop stopColor="#ff6b24" /><stop offset="1" stopColor="#d8ef75" /></linearGradient><filter id="soft-glow"><feGaussianBlur stdDeviation="8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <path className="route-ghost" d="M38 424 C176 390 180 205 315 256 S470 435 696 90" />
      <path className="route-line" d="M38 424 C176 390 180 205 315 256 S470 435 696 90" />
      <g className="route-node origin"><circle cx="38" cy="424" r="11" /><circle cx="38" cy="424" r="24" /></g>
      <g className="route-node current"><circle cx="315" cy="256" r="9" /><circle cx="315" cy="256" r="22" /></g>
      <g className="route-node destination"><circle cx="696" cy="90" r="11" /><circle cx="696" cy="90" r="24" /></g>
      <path className="route-dash" d="M40 424 C176 390 180 205 315 256 S470 435 696 90" />
    </svg>
    <span className="route-label route-origin"><b>01</b> ORIGIN / DELHI</span><span className="route-label route-current"><b>LIVE</b> HANDOFF / 28.61°N</span><span className="route-label route-destination"><b>04</b> DESTINATION / INDIA</span>
    <div className="route-card"><span>SHIPMENT SIGNAL</span><strong>Every mile leaves a trace.</strong><small>LR / AWB · ETA · EXCEPTION</small></div>
  </div>;
}

function ProductProof() {
  const [active, setActive] = useState(0);
  const snapshot = panelSnapshots[active];
  return <section className="product-proof" id="platform" aria-labelledby="product-proof-title"><div className="product-proof-top"><div><span className="overline">02 / THE CONTROL ROOM *</span><h2 id="product-proof-title">The product<br /><em>does the talking.</em></h2></div><p>Real PSS workspaces, arranged as a visual proof of the work behind every move.</p></div><div className="product-stage"><div className="product-frame"><div className="frame-bar"><span><i /><i /><i /></span><b>PSS / AUTHENTICATED WORKSPACE</b><em>LIVE DATA INSIDE THE PANEL</em></div><Image key={snapshot.image} src={snapshot.image} alt={snapshot.alt} width={455} height={666} sizes="(max-width: 900px) 92vw, 42vw" /></div><div className="product-stage-copy"><span className="overline lime">{snapshot.label} *</span><h3>{snapshot.title}</h3><p>Booking, tracking, documents, references, and operational action—connected around the shipment instead of scattered across tabs.</p><a className="text-link" href="https://client.psslogistics.in/dashboard">Open the PSS workspace <Arrow /></a><div className="product-switcher" role="tablist" aria-label="PSS workspace previews">{panelSnapshots.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={active === index} className={active === index ? "is-active" : ""} onClick={() => setActive(index)}><span>0{index + 1}</span>{item.label}</button>)}</div></div></div><p className="creative-note">* Creative presentation: these panel views are composed as marketing proof; live product behaviour and shipment data remain in the authenticated PSS workspaces.</p></section>;
}

function ExceptionTheatre() {
  const [active, setActive] = useState(2);
  return <section className="exception-theatre" aria-labelledby="exception-title"><div className="section-shell"><div className="theatre-intro"><span className="overline lime">03 / WHEN THE MOVE CHANGES</span><h2 id="exception-title">The problem is<br /><em>part of the route.</em></h2><p>Visibility is only useful when it changes what happens next. PSS brings the exception forward, with the context to act.</p></div><div className="theatre-layout"><div className="exception-list" role="tablist" aria-label="Shipment exception examples">{[["01", "Weight changed", "Provider weight is higher than the booking."], ["02", "LR pending", "The manifest needs a provider reference."], ["03", "Pickup at risk", "The origin is not ready for collection."]].map(([number, title, text], index) => <button key={number} type="button" role="tab" aria-selected={active === index} className={active === index ? "is-active" : ""} onClick={() => setActive(index)}><span>{number}</span><strong>{title}</strong><small>{text}</small><Arrow /></button>)}</div><div className="exception-card"><span className="overline">PSS ACTION BOARD / 0{active + 1}</span><div className="exception-card-top"><div><small>SHIPMENT</small><strong>3219654906</strong></div><span className="exception-status">NEEDS ACTION</span></div><div className="exception-event"><span>EVENT</span><strong>{active === 0 ? "Weight reconciliation" : active === 1 ? "Manifest response" : "Pickup readiness"}</strong><p>{active === 0 ? "Compare client-entered weight with provider weight before billing." : active === 1 ? "Keep the shipment honest until LR / AWB is returned." : "Resolve the warehouse state before requesting pickup."}</p></div><div className="exception-footer"><span>OWNED BY PSS</span><span>UPDATED JUST NOW</span></div></div></div></div></section>;
}

export default function Home() {
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setHasScrolled(window.scrollY > 30); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", "@id": "https://psslogistics.in/#organization", name: "PSS Logistics", url: "https://psslogistics.in/", logo: "https://psslogistics.in/brand/pss-logo.png", description: "Business courier, freight, shipment tracking, pickup, and delivery operations from PSS Logistics.", email: "hello@psslogistics.in", areaServed: { "@type": "Country", name: "India" }, knowsAbout: ["Courier shipping", "Freight forwarding", "Shipment tracking", "Pickup management", "RTO and NDR operations"], sameAs: ["https://client.psslogistics.in"] };
  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: "PSS Logistics shipping and shipment tracking", provider: { "@id": "https://psslogistics.in/#organization" }, areaServed: { "@type": "Country", name: "India" }, serviceType: ["Freight forwarding", "Courier shipping", "Shipment tracking", "Pickup management"] };
  return <main className="overhaul"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} /><header className={`overhaul-header${hasScrolled ? " is-scrolled" : ""}`}><a className="overhaul-logo" href="#top"><Image src="/brand/pss-logo.png" alt="PSS Logistics — Direct to every direction" width={184} height={92} priority /></a><nav aria-label="Primary navigation"><a href="#network">Network</a><a href="#platform">Product</a><a href="#track">Track</a><a href="#about">About</a></nav><div className="overhaul-actions"><a href="https://client.psslogistics.in/sign-in">Sign in</a><a className="overhaul-button" href="https://client.psslogistics.in/sign-up">Start shipping <Arrow /></a></div></header>
    <section className="overhaul-hero" id="top"><div className="hero-noise" /><div className="hero-grid" /><div className="hero-copy"><span className="overline orange">PSS LOGISTICS / THE SHIPMENT OPERATING SYSTEM</span><h1>Every shipment<br /><em>has a story.</em></h1><p>We keep the booking, the handoff, the exception, and the outcome connected.</p><div className="hero-actions"><a className="overhaul-button" href="#platform">Enter the control room <Arrow /></a><a className="text-link" href="#network">See the network <Arrow /></a></div><div className="hero-index"><span>THE NETWORK IS ALIVE</span><span>28° 38′ N / 77° 13′ E</span></div></div><RouteField /><div className="hero-scroll">SCROLL TO MOVE <span>↓</span></div><TrackingCommand /></section>
    <div className="signal-ticker"><div>BOOK <b>✦</b> MANIFEST <b>✦</b> MOVE <b>✦</b> TRACK <b>✦</b> RESOLVE <b>✦</b> RECONCILE <b>✦</b> BOOK <b>✦</b> MANIFEST <b>✦</b> MOVE <b>✦</b> TRACK <b>✦</b></div></div>
    <section className="manifest-reveal section-shell" id="about"><div><span className="overline">01 / THE IDEA</span><h2>Not a delivery<br /><em>website.</em></h2></div><div className="manifest-reveal-copy"><p>Logistics is a chain of decisions. PSS gives every person in that chain one clear place to see what changed, what matters, and what to do next.</p><a className="text-link" href="#platform">Follow one shipment <Arrow /></a></div></section>
    <section className="lifecycle section-shell" id="network"><div className="lifecycle-head"><span className="overline">THE SHIPMENT / IN FOUR SIGNALS</span><span>FROM FIRST DETAIL TO FINAL PROOF</span></div><div className="lifecycle-title"><h2>Move with<br /><em>direction.</em></h2><p>The product and the promise are the same: fewer blind spots between here and there.</p></div><div className="lifecycle-rail">{lifecycle.map(([number, title, text], index) => <div className={index === 1 ? "is-current" : ""} key={number}><span>{number}</span><i /><strong>{title}</strong><p>{text}</p></div>)}</div></section>
    <ProductProof />
    <ExceptionTheatre />
    <section className="finance-proof section-shell"><div className="finance-copy"><span className="overline">04 / THE COMMERCIAL STORY</span><h2>Know what the move<br /><em>means.</em></h2><p>Client billing, provider cost, reconciled weight, and margin belong in the same operational picture.</p><a className="text-link" href="https://master-pss.vercel.app/finance/margins">See margin visibility <Arrow /></a></div><div className="finance-card"><div className="finance-card-head"><span>SHIPMENT ECONOMICS</span><b>DEMO VIEW *</b></div><div className="finance-row"><span>CLIENT PAID</span><strong>₹ 1,350.39</strong></div><div className="finance-row"><span>PROVIDER COST</span><strong>₹ 1,106.20</strong></div><div className="finance-row muted"><span>RECONCILED WEIGHT</span><strong>20 KG</strong></div><div className="finance-total"><span>VISIBLE MARGIN</span><strong>₹ 244.19</strong><small>Example presentation · verify against live records.</small></div></div></section>
    <section className="services-overhaul"><div className="section-shell"><div className="services-overhaul-head"><span className="overline lime">05 / THE WORK</span><h2>One workspace.<br /><em>Every pressure.</em></h2><p>For the teams who book, move, track, resolve, and reconcile freight every day.</p></div><div className="service-list-overhaul">{services.map(([number, title, text]) => <a href="#platform" key={number}><span>{number}</span><strong>{title}</strong><p>{text}</p><Arrow /></a>)}</div></div></section>
    <section className="final-overhaul section-shell"><div className="final-overhaul-image"><Image src="/hero/freight-handoff.png" alt="A labelled shipment being handed over at a freight warehouse" fill sizes="(max-width: 900px) 100vw, 55vw" /><span>DIRECT TO<br /><strong>EVERY DIRECTION</strong></span></div><div className="final-overhaul-copy"><span className="overline orange">THE NEXT MOVE</span><h2>Make the<br /><em>route clear.</em></h2><p>Bring every shipment signal into focus with PSS Logistics.</p><a className="overhaul-button" href="https://client.psslogistics.in/sign-up">Start shipping <Arrow /></a><a className="text-link" href="https://client.psslogistics.in/sign-in">Sign in to your workspace <Arrow /></a></div></section>
    <footer className="overhaul-footer section-shell"><a className="overhaul-logo" href="#top"><Image src="/brand/pss-logo.png" alt="PSS Logistics" width={154} height={77} /></a><span>Operational clarity for every shipment.</span><div><a href="#network">Network</a><a href="#platform">Product</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@psslogistics.in">Contact</a></div></footer>
  </main>;
}
