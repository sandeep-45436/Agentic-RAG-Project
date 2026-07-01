import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-xl tracking-tighter">AI SaaS</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4">
            Pricing
          </Link>
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:p-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 max-w-[600px] text-muted-foreground md:text-lg">
          Choose the plan that best fits your needs.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
          {/* Free Plan */}
          <div className="flex flex-col p-6 border rounded-xl shadow-sm text-left">
            <h3 className="text-2xl font-bold">Free</h3>
            <div className="mt-4 text-4xl font-extrabold">$0<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
            <p className="mt-2 text-sm text-muted-foreground">For individuals just getting started.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 100 AI Generations</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Community Support</li>
            </ul>
            <Button className="mt-6 w-full" variant="outline">Get Started</Button>
          </div>
          {/* Pro Plan */}
          <div className="flex flex-col p-6 border-2 border-primary rounded-xl shadow-md text-left relative">
            <div className="absolute top-0 right-6 transform -translate-y-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold">Pro</h3>
            <div className="mt-4 text-4xl font-extrabold">$29<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
            <p className="mt-2 text-sm text-muted-foreground">For professionals scaling their workflows.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited AI Generations</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Priority Support</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Advanced Analytics</li>
            </ul>
            <Button className="mt-6 w-full">Upgrade to Pro</Button>
          </div>
          {/* Enterprise Plan */}
          <div className="flex flex-col p-6 border rounded-xl shadow-sm text-left">
            <h3 className="text-2xl font-bold">Enterprise</h3>
            <div className="mt-4 text-4xl font-extrabold">Custom</div>
            <p className="mt-2 text-sm text-muted-foreground">For large teams with advanced needs.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Everything in Pro</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Dedicated Account Manager</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> SSO & Custom Contracts</li>
            </ul>
            <Button className="mt-6 w-full" variant="outline">Contact Sales</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
