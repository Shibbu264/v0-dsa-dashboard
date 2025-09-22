import { DSADashboard } from "@/components/dsa-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">DSA Questions Dashboard</h1>
            <p className="text-muted-foreground">Track your Data Structures and Algorithms practice progress</p>
          </div>
          <ThemeToggle />
        </div>
        <DSADashboard />
      </div>
    </main>
  )
}
