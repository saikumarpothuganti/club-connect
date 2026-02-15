import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Fingerprint, BarChart3, Clock, Menu, X } from "lucide-react";

const features = [
  { icon: MapPin, title: "GPS Zone Tracking", desc: "Automatic attendance based on GPS boundary detection. Sessions start and end as you enter or leave the zone." },
  { icon: Fingerprint, title: "Biometric Security", desc: "WebAuthn fingerprint authentication ensures only verified members can mark attendance." },
  { icon: Clock, title: "Real-Time Tracking", desc: "Live zone status indicators and session tracking with instant dashboard updates." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Comprehensive attendance reports with per-day breakdowns, total hours, and session history." },
];

const Index: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-primary">CampusLog</Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
            <Link to="/register"><Button size="sm">Register</Button></Link>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t bg-card px-4 py-3 md:hidden space-y-2">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Features</a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">About</a>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block"><Button variant="outline" size="sm" className="w-full">Login</Button></Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block"><Button size="sm" className="w-full">Register</Button></Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Campus<span className="text-primary">Log</span>
          </h1>
          <p className="mt-2 text-lg font-medium text-muted-foreground">Surabhi Club Attendance Management System</p>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            A GPS-based, fingerprint-secured attendance tracking platform for college clubs.
            Automatically track member presence with geofencing, biometric verification, and real-time analytics.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/login"><Button size="lg" className="w-full sm:w-auto">Member Login</Button></Link>
            <Link to="/login?tab=super-admin"><Button size="lg" variant="outline" className="w-full sm:w-auto">Admin Login</Button></Link>
            <Link to="/register"><Button size="lg" variant="secondary" className="w-full sm:w-auto">Register</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Features</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">Everything you need for seamless club attendance management.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-0 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">About Surabhi Club</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            CampusLog is the official attendance management system for Surabhi Club. It replaces manual
            roll-calls with automatic GPS-based zone detection and biometric authentication, ensuring
            accurate, tamper-proof attendance records for every club session.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <p className="text-center text-sm text-muted-foreground">CampusLog © {year}</p>
      </footer>
    </div>
  );
};

export default Index;
