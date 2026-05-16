import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Kirjautuminen onnistui");
      window.location.hash = "#/admin";
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-3xl">Kirjaudu sisään</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vain admin voi muokata sisältöä.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Sähköposti</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Salasana</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Kirjaudutaan…" : "Kirjaudu"}
        </Button>
      </form>
    </div>
  );
}
