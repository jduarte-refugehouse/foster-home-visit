"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, FileText, TrendingUp, AlertTriangle, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

export function QADirectorDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Quality Assurance Dashboard</h1>
            <Badge variant="destructive">
              <Shield className="h-3 w-3 mr-1" />
              QA Director
            </Badge>
          </div>
          <p className="text-muted-foreground">Sheila Mathis - Foster Home Quality Assurance Director</p>
        </div>
      </div>

      {/* QA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-muted-foreground">Awaiting QA review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Identified</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* QA Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>Overall quality assurance performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Visit Report Quality</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Documentation Completeness</span>
                <span className="text-sm text-muted-foreground">96%</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance Score</span>
                <span className="text-sm text-muted-foreground">89%</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Timeliness</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent QA Activity</CardTitle>
            <CardDescription>Latest quality assurance reviews and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Johnson Family Visit - Approved</p>
                  <p className="text-xs text-muted-foreground">Reviewed by Sheila Mathis - 2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Smith Family Visit - Needs Revision</p>
                  <p className="text-xs text-muted-foreground">Documentation incomplete - 4 hours ago</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <FileText className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Davis Family Visit - Under Review</p>
                  <p className="text-xs text-muted-foreground">Assigned to QA team - 6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QA Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Assurance Tools</CardTitle>
          <CardDescription>QA management and oversight functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/quality-assurance/reviews">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Review Queue</div>
                    <div className="text-xs text-muted-foreground">12 pending reviews</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/quality-assurance/reports">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">QA Reports</div>
                    <div className="text-xs text-muted-foreground">Generate quality reports</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/cases">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">All Cases</div>
                    <div className="text-xs text-muted-foreground">System-wide oversight</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
