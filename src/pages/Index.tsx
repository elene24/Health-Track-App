import { Link } from "react-router-dom";
import { Activity, Upload, LineChart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">HealthTrack</span>
        </div>

        <div className="flex gap-2">
          <Link to="/access">
            <Button variant="outline">Upload without login</Button>
          </Link>

          <Link to={user ? "/dashboard" : "/auth"}>
            <Button>{user ? "Dashboard" : "Get Started"}</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
          Track Your Health,
          <br />
          <span className="text-primary">Understand Your Body</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload blood test results, track metrics over time, and visualize your health journey with beautiful interactive charts.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="btn-primary-gradient text-lg px-8 py-6">
              {user ? "Go to Dashboard" : "Start Tracking Free"}
            </Button>
          </Link>

          <Link to="/access">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Upload without login
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto">
          {[
            { icon: Upload, title: "Easy Upload", desc: "Upload TXT or PDF files and let AI extract your health metrics automatically" },
            { icon: LineChart, title: "Visual Insights", desc: "Interactive charts to track trends and compare results over time" },
            { icon: Shield, title: "Secure & Private", desc: "Your health data is encrypted and only accessible by you" },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl bg-card border border-border/50 text-left">
              <f.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;