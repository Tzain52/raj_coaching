"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Rocket, MapPin, Phone, MessageCircle, GraduationCap, BookOpen, Star, ChevronRight } from "lucide-react";
import { trackSignIn } from "@/lib/ga";

export default function SignIn() {
  const phone = "919406529313";
  const whatsappMsg = encodeURIComponent("Hello! I'm interested in enrolling at Raj Coaching and Career Counselling Centre. Please share details about available courses and fees.");

  return (
    <div
      className="min-h-screen bg-slate-950 text-white"
      style={{
        backgroundImage: "radial-gradient(rgba(0,212,255,0.08) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-12 pb-8 text-center">
        <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-5">
          <Rocket className="h-10 w-10 text-cyan-400" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Raj Coaching &amp;
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Career Counselling Centre
          </span>
        </h1>
        <p className="text-slate-400 text-base mt-2 max-w-xs">
          Empowering students to achieve their dreams — one class at a time.
        </p>
      </div>

      {/* Sign in card */}
      <div className="px-4 max-w-sm mx-auto mb-8">
        <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,212,255,0.12)] p-6 space-y-4">
          <div className="text-center">
            <p className="text-white font-bold text-lg">Already enrolled?</p>
            <p className="text-slate-400 text-sm">Sign in with your Google account to access your portal.</p>
          </div>

          <Button
            onClick={() => { trackSignIn(); signIn("google", { callbackUrl: "/" }); }}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 text-white shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Only registered students can access the portal.
          </p>
        </div>
      </div>

      {/* Not registered? CTA */}
      <div className="px-4 max-w-sm mx-auto mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border border-cyan-500/20 p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full border border-cyan-500/20">
            <Star className="h-3 w-3" /> New Student?
          </div>
          <p className="text-white font-bold text-base">Want to enrol at RCCC?</p>
          <p className="text-slate-400 text-sm">
            Call or WhatsApp us to register. We&apos;ll get you set up right away!
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <a
              href={`https://wa.me/${phone}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us — 9406529313
            </a>
            <a
              href="tel:+919406529313"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call — 9406529313
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 max-w-sm mx-auto mb-8">
        <p className="text-slate-500 text-xs text-center uppercase tracking-widest mb-4">What we offer</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <BookOpen className="h-5 w-5 text-cyan-400" />, title: "Study Material", desc: "Chapter-wise notes & PDFs" },
            { icon: <GraduationCap className="h-5 w-5 text-purple-400" />, title: "Expert Coaching", desc: "Class 9–12 all subjects" },
            { icon: <Star className="h-5 w-5 text-yellow-400" />, title: "Career Guidance", desc: "Counselling & mentorship" },
            { icon: <Rocket className="h-5 w-5 text-pink-400" />, title: "Online Portal", desc: "Access anytime, anywhere" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-1.5">
              {f.icon}
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-slate-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Address + Map */}
      <div className="px-4 max-w-sm mx-auto mb-12">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Find Us</p>
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold">Raj Coaching Centre</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                Opp. Punjabi Nursing Home,<br />
                Jawahar Marg, Rajgarh Road,<br />
                Biaora — 465 674
              </p>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/Bbz2X5SFzdCaCBN96"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Open in Google Maps
            </span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-4">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Raj Coaching &amp; Career Counselling Centre, Biaora
        </p>
      </div>
    </div>
  );
}
