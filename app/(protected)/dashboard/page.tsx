import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { Search } from "@/components/search"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

const DashboardPage = () => {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome to {MICROSERVICE_CONFIG.name}</h2>
          <p className="text-muted-foreground">{MICROSERVICE_CONFIG.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Search />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>
              Overview of {MICROSERVICE_CONFIG.name.toLowerCase()} activities and key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>Total active subscriptions this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Sales</CardTitle>
            <CardDescription>Number of new sales made this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Now</CardTitle>
            <CardDescription>Number of users actively visiting your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Overview />
        <RecentSales />
      </div>
    </>
  )
}

export default DashboardPage
