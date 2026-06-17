import fs from "fs";
import path from "path";
import LandingPageClient from "./LandingPageClient";

export default function RootPage() {
  // Read portfolio.html synchronously from the server-side
  const htmlPath = path.join(process.cwd(), "src", "app", "portfolio.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Pass it directly to client component for smooth interaction
  return <LandingPageClient initialHtml={htmlContent} />;
}
