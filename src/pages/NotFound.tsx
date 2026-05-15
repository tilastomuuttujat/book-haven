import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl">404</h1>
        <p className="mt-2 text-muted-foreground">Sivua ei löytynyt.</p>
        <Link to="/" className="mt-6 inline-block underline">Etusivulle</Link>
      </div>
    </div>
  );
}
