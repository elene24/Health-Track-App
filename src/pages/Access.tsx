import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Access() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email || !accessCode) {
      toast({ title: "Missing fields", description: "Please enter email and access code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Access denied", description: data?.error || "Invalid email or code", variant: "destructive" });
        return;
      }

      localStorage.setItem("guestUserId", data.userId);
      localStorage.setItem("guestEmail", email);

      toast({ title: "Access granted", description: "You can now upload or enter data." });
      navigate("/guest/upload");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Request failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload without login</CardTitle>
          <CardDescription>Enter the account email and access code to add health data.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>

          <div className="space-y-2">
            <Label>Access code</Label>
            <Input value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="e.g. A3F19C2D" />
          </div>

          <Button className="w-full" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Continue"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <Link className="underline" to="/auth">Log in / Sign up instead</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}