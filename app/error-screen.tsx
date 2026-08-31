"use client";

import { useRouter } from "next/navigation";

export type ErrorScreenProps = {
  statusCode: number;
  title?: string;
  description?: string;
  requestId?: string;
  retry?: () => void;
};

const copy: Record<number, [string, string]> = {
  400: ["Bad request", "The request could not be understood by this service."],
  401: ["Authentication required", "Your session is missing, expired, or no longer valid."],
  403: ["Access denied", "This resource is not available for your current account."],
  404: ["Page not found", "The route exists somewhere in the system, but not here."],
  408: ["Request timed out", "The service took too long to receive a complete request."],
  409: ["Request conflict", "This action conflicts with the current state of the resource."],
  410: ["No longer available", "This resource has been permanently removed."],
  413: ["Payload too large", "The submitted data is larger than this service allows."],
  429: ["Too many requests", "Please pause briefly before trying this again."],
  500: ["Internal failure", "The service encountered an unexpected condition."],
  501: ["Not implemented", "This service does not support that capability yet."],
  502: ["Bad gateway", "An upstream service returned an invalid response."],
  503: ["Service unavailable", "The service is temporarily unable to handle this request."],
  504: ["Gateway timeout", "An upstream service did not respond in time."],
  505: ["HTTP version unsupported", "The requested HTTP protocol version is not supported."],
};

export function ErrorScreen({ statusCode, title, description, requestId, retry }: ErrorScreenProps) {
  const router = useRouter();
  const [defaultTitle, defaultDescription] = copy[statusCode] ?? ["Request failed", "The service could not complete this request."];
  return <main role="alert" style={{ minHeight: "100svh", boxSizing: "border-box", padding: "clamp(24px, 7vw, 96px)", background: "#f1eee7", color: "#111", fontFamily: "Arial Narrow, Helvetica Neue, Arial, sans-serif", display: "grid", placeItems: "center" }}>
    <section style={{ width: "min(100%, 1100px)", border: "3px solid #111", background: "#f8f6f0", boxShadow: "14px 14px 0 #d8402f" }}>
      <div style={{ padding: "14px 18px", borderBottom: "3px solid #111", display: "flex", justifyContent: "space-between", gap: 16, font: "800 11px ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".12em" }}><span>PSS / SYSTEM RESPONSE</span><span>PUBLIC FAILURE</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(220px, .6fr)" }}>
        <div style={{ padding: "clamp(28px, 7vw, 80px) clamp(22px, 6vw, 72px)", borderRight: "3px solid #111" }}><span style={{ color: "#d8402f", font: "800 12px ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".16em" }}>STATUS CODE</span><div style={{ margin: "34px 0 30px", fontSize: "clamp(110px, 22vw, 300px)", lineHeight: ".78", letterSpacing: "-.09em", fontWeight: 900 }}>{statusCode}</div><h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 72px)", lineHeight: ".95", letterSpacing: "-.055em", textTransform: "uppercase" }}>{title ?? defaultTitle}</h1><p style={{ maxWidth: 520, margin: "22px 0 0", font: "13px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace" }}>{description ?? defaultDescription}</p></div>
        <aside style={{ background: "#111", color: "#f8f6f0", padding: "clamp(24px, 4vw, 48px)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 40 }}><div style={{ font: "11px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".08em" }}><b style={{ color: "#d8402f" }}>DIAGNOSTIC</b><div style={{ marginTop: 18 }}>REQUEST INTERRUPTED</div><div>SAFE RESPONSE MODE: ON</div>{requestId && <div style={{ marginTop: 18, color: "#c8c3b8" }}>REF: {requestId}</div>}</div><div style={{ display: "grid", gap: 10 }}><button type="button" onClick={retry} style={{ padding: 13, cursor: "pointer", border: "2px solid #f8f6f0", background: "#f8f6f0", color: "#111", fontWeight: 900, textTransform: "uppercase" }}>Try again</button><button type="button" onClick={() => window.history.length > 1 ? router.back() : window.location.assign("https://psslogistics.in")} style={{ padding: 13, cursor: "pointer", border: "2px solid #f8f6f0", background: "transparent", color: "#f8f6f0", fontWeight: 900, textTransform: "uppercase" }}>Go back</button><a href="https://psslogistics.in" style={{ padding: 13, border: "2px solid #d8402f", background: "#d8402f", color: "#111", textAlign: "center", fontWeight: 900, textTransform: "uppercase", textDecoration: "none" }}>Go to home</a></div></aside>
      </div>
      <div style={{ padding: "12px 18px", borderTop: "3px solid #111", font: "800 10px ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".1em" }}>NO STACK TRACE EXPOSED / TECHNICAL DETAILS LOGGED SERVER-SIDE</div>
    </section>
    <style>{`@media(max-width:700px){section>div:nth-child(2){grid-template-columns:1fr!important}section>div:nth-child(2)>div:first-child{border-right:0!important;border-bottom:3px solid #111}}`}</style>
  </main>;
}
