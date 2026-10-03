import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SessionProvider } from "@/components/session-provider";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
