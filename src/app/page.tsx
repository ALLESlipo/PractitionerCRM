import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { LandingHeader } from "@/components/landing-header";
import { Logo } from "@/components/logo";

// Public landing page. Everything here is static except the header's account
// button, which reads the session behind a Suspense boundary.

const IMG = "/assets/images";

const steps = [
  {
    title: "Get verified",
    text: "Sign up and upload your license and diplomas. Our team reviews every practitioner before any client data is reachable.",
  },
  {
    title: "Add clients and kits",
    text: "Register a client with the kit ID and access code from the Mimatest box. Personal details are encrypted the moment you save.",
  },
  {
    title: "Upload report and food guide",
    text: "Attach the Mimatest report and the client's food guide. Marker values are extracted for you to confirm.",
  },
  {
    title: "Share and ask",
    text: "Send documents through expiring secure links, and ask the assistant questions grounded in approved sources.",
  },
];

const scale = [
  { label: "Low", cls: "bg-rose-400" },
  { label: "Below optimal", cls: "bg-amber-300" },
  { label: "Optimal", cls: "bg-emerald-400" },
  { label: "Above optimal", cls: "bg-amber-300" },
  { label: "High", cls: "bg-rose-400" },
];

// Illustrative values for the preview card only.
const sampleMarkers = [
  { code: "MNS", name: "Metabolic Nucleus Score", level: 1 },
  { code: "PLG", name: "Plasmalogen", level: 1 },
  { code: "TML", name: "Total Microbial Load", level: 2 },
  { code: "LPS", name: "Endotoxin (LPS)", level: 3 },
];

const credits = [
  { name: "Anna Pelzer", profile: "https://unsplash.com/@annapelzer" },
  { name: "B Y G", profile: "https://unsplash.com/@beyzahzah" },
  { name: "Trust “Tru” Katsande", profile: "https://unsplash.com/@iamtru" },
  { name: "Anshu A", profile: "https://unsplash.com/@anshu18" },
  { name: "Ella Olsson", profile: "https://unsplash.com/@ellaolsson" },
  { name: "Emma Simpson", profile: "https://unsplash.com/@esdesignisms" },
];

export default function LandingPage() {
  return (
    <div className="bg-stone-50 text-slate-900">
      <LandingHeader
        account={
          <Suspense fallback={<GuestButtons />}>
            <AccountButton />
          </Suspense>
        }
      />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <Privacy />
      <ClosingCta />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function AccountButton() {
  const user = await getCurrentUser();
  if (!user) return <GuestButtons />;
  return (
    <Link href={homeFor(user)} className={primaryPill}>
      Open your dashboard
    </Link>
  );
}

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition md:py-2";
const primaryPill = `${pill} bg-white text-teal-900 shadow-sm hover:bg-emerald-50 group-data-[solid=true]:bg-teal-800 group-data-[solid=true]:text-white group-data-[solid=true]:hover:bg-teal-900`;
const secondaryPill = `${pill} font-medium text-white/90 hover:text-white group-data-[solid=true]:text-slate-700 group-data-[solid=true]:hover:text-teal-900 max-md:border max-md:border-slate-300`;

function GuestButtons() {
  return (
    <>
      <Link href="/login" className={secondaryPill}>
        Log in
      </Link>
      <Link href="/signup" className={primaryPill}>
        Get started
      </Link>
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden sm:min-h-[92vh]">
      <Image
        src={`${IMG}/hero-gut-bowl.jpg`}
        alt="A colourful bowl of vegetables, chickpeas and greens"
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-950/95 via-teal-950/80 to-teal-950/20" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-20 bg-gradient-to-t from-stone-50 to-transparent sm:h-40" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 pt-28 pb-24 sm:px-6 sm:pt-32 sm:pb-32 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-100 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Built for gut health practitioners
          </p>
          <h1 className="font-display text-[2.4rem] leading-[1.08] font-semibold tracking-tight text-balance text-white sm:text-6xl sm:leading-[1.05]">
            Every Mimatest result, turned into a clear plan for your client.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg">
            Manage clients and test kits, deliver reports and food guides securely, and get AI support
            grounded in the sources you trust, all in one calm, private workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/signup"
              className="rounded-full bg-emerald-300 px-7 py-3.5 text-center text-sm font-semibold text-teal-950 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-200 sm:py-3"
            >
              Apply as a practitioner
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:py-3"
            >
              See how it works
            </a>
          </div>
        </div>

        <ResultPreview />
      </div>
    </section>
  );
}

/** A glass card illustrating the five-level result scale from the Mimatest report. */
function ResultPreview() {
  return (
    <div className="relative hidden lg:block" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-emerald-300/20 blur-3xl" />
      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-white/60 uppercase">Sample report</p>
            <p className="mt-1 font-mono text-sm text-white/90">Kit DBUQ··2449</p>
          </div>
          <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-medium text-emerald-100">Confirmed</span>
        </div>
        <ul className="mt-6 space-y-4">
          {sampleMarkers.map((m) => (
            <li key={m.code}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span>
                  <span className="font-mono font-semibold">{m.code}</span>
                  <span className="ml-2 text-white/60">{m.name}</span>
                </span>
                <span className="text-xs text-white/70">{scale[m.level].label}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {scale.map((s, i) => (
                  <span
                    key={s.label}
                    className={`h-2 rounded-full ${i === m.level ? s.cls : "bg-white/15"}`}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-teal-950/50 p-4 text-sm leading-relaxed text-white/85">
          <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-200 uppercase">Assistant</p>
          Reduced MNS with elevated LPS often points to a weakened core community. Your protocol notes suggest…
          <p className="mt-2 text-xs text-white/50">2 sources · decision support, not a diagnosis</p>
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { k: "Verified", v: "Only credential-checked practitioners" },
    { k: "Encrypted", v: "Client details encrypted at rest" },
    { k: "Private", v: "The AI never sees names or contacts" },
    { k: "Audited", v: "Every view and change is logged" },
  ];
  return (
    <section className="relative z-10 mx-auto -mt-12 w-full max-w-6xl px-4 sm:-mt-16 sm:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl shadow-slate-900/5 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.k} className="bg-white px-4 py-4 sm:px-6 sm:py-5">
            <p className="font-display text-base font-semibold text-teal-900 sm:text-lg">{i.k}</p>
            <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">{i.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase">{eyebrow}</p>
      <h2 className="font-display mt-3 text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{children}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow="How it works" title="From the box to a confident conversation">
            Four steps that follow the way you already work with Mimatest.
          </SectionHeading>
          <ol className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span className="font-display flex h-10 w-10 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-teal-900 text-lg font-semibold text-emerald-200">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-teal-950/20 sm:aspect-[4/5]">
            <Image
              src={`${IMG}/lab-microscope.jpg`}
              alt="A scientist examining a sample through a microscope"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-5 shadow-xl sm:block">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Kit status</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Awaiting</span>
              <span className="text-slate-300">→</span>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">Uploaded</span>
              <span className="text-slate-300">→</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">Sent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  image,
  alt,
  eyebrow,
  title,
  points,
  reverse,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  points: string[];
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
      <div className={`relative aspect-[3/2] overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10 sm:aspect-[4/3] ${reverse ? "lg:order-2" : ""}`}>
        <Image src={`${IMG}/${image}`} alt={alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </div>
      <div>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <ul className="mt-6 space-y-4 sm:mt-8">
          {points.map((p) => (
            <li key={p} className="flex gap-3 leading-relaxed text-slate-700">
              <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0 text-teal-600" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="bg-white py-16 sm:py-32">
      <div className="mx-auto w-full max-w-6xl space-y-16 px-4 sm:space-y-32 sm:px-6">
        <Feature
          image="practitioner-consultation.jpg"
          alt="A nutritionist at her desk with a laptop and a bowl of fruit"
          eyebrow="Client management"
          title="Your whole practice, in one place"
          points={[
            "Create, view, edit and archive clients, each with their Mimatest kits.",
            "Search across names, emails and kit IDs in an instant.",
            "Kit IDs and access codes stay with the client, ready when you need them.",
          ]}
        />
        <Feature
          image="fermented-jars.jpg"
          alt="Three glass jars of fermented pickles, beetroot and cabbage"
          eyebrow="Results"
          title="Markers you can read at a glance"
          reverse
          points={[
            "Values from the Mimatest report are matched to a marker catalog and checked by you.",
            "Every marker sits on the report's five-level scale, from low to high.",
            "Flags are calculated by the platform, never guessed by AI.",
          ]}
        />
        <Feature
          image="food-guide-meal.jpg"
          alt="A light flat-lay of a vegetable meal on a wooden board"
          eyebrow="Food guides & delivery"
          title="Send the plan, not an attachment"
          points={[
            "Keep each client's report and food guide together, with every version saved.",
            "Email documents as secure links that expire, with no health data in the subject.",
            "See when a client first opened what you sent.",
          ]}
        />
      </div>
    </section>
  );
}

function Privacy() {
  const rules = [
    ["Encryption by default", "Names, contact details, notes and access codes are encrypted before they reach the database."],
    ["Your clients only", "Every request is checked on the server, so practitioners only ever see their own clients."],
    ["AI without identities", "The assistant receives marker values and approved sources, never a name, email or phone number."],
    ["A full audit trail", "Logins, views, uploads, edits and denied attempts are all recorded."],
  ];
  return (
    <section id="privacy" className="bg-teal-950 py-16 text-white sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">Privacy by design</p>
          <h2 className="font-display mt-3 text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Health data deserves more than a password
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
            Built around GDPR-aligned rules from the first line of code. The platform supports your judgement;
            it never diagnoses on its own.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          {rules.map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-emerald-200 sm:text-xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-white/75">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-36">
      <Image
        src={`${IMG}/wellbeing-walk.jpg`}
        alt="A person walking along a sunlit forest path"
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-teal-950/70" />
      <div className="mx-auto max-w-3xl px-4 text-center text-white sm:px-6">
        <h2 className="font-display text-[1.9rem] leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          Give every client a clearer path forward.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Join as a verified practitioner and bring your Mimatest work into one secure workspace.
        </p>
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-300 px-8 py-3.5 text-sm font-semibold text-teal-950 transition hover:bg-emerald-200 sm:py-3"
          >
            Apply as a practitioner
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:py-3"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-stone-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:px-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm">A support tool for gut health practitioners. It does not provide medical diagnoses.</p>
        </div>
        <p className="max-w-md sm:text-right">
          Photography from{" "}
          <a href="https://unsplash.com" className="underline hover:text-slate-800">
            Unsplash
          </a>{" "}
          by{" "}
          {credits.map((c, i) => (
            <span key={c.name}>
              <a href={c.profile} className="underline hover:text-slate-800">
                {c.name}
              </a>
              {i < credits.length - 2 ? ", " : i === credits.length - 2 ? " and " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
