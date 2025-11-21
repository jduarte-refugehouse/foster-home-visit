"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@refugehouse/shared-core/components/ui/table"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@refugehouse/shared-core/components/ui/dialog"
import { Checkbox } from "@refugehouse/shared-core/components/ui/checkbox"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Save, X } from "lucide-react"

interface Microservice {
  id: string
  app_code: string
  app_name: string
  description: string | null
}

interface NavigationItem {
  id: string
  code: string
  title: string
  url: string
  icon: string
  permission_required: string | null
  category: string
  subcategory: string | null
  order_index: number
  is_active: boolean
  is_collapsible: boolean
  item_type: string
  parent_navigation_id: string | null
  parent_title: string | null
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  permission_code: string
  permission_name: string
}

export default function MenuManagementPage() {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  
  const [microservices, setMicroservices] = useState<Microservice[]>([])
  const [selectedMicroservice, setSelectedMicroservice] = useState<string>("")
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    url: "",
    icon: "",
    permission_required: "",
    category: "Administration",
    subcategory: "",
    order_index: 0,
    is_active: true,
    is_collapsible: false,
    item_type: "domain",
    parent_navigation_id: "",
  })

  // Fetch microservices on mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchMicroservices()
    }
  }, [isLoaded, user])

  // Fetch navigation items when microservice changes
  useEffect(() => {
    if (selectedMicroservice) {
      fetchNavigationItems()
      fetchPermissions()
    }
  }, [selectedMicroservice])

  const fetchMicroservices = async () => {
    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      }

      const response = await fetch("/api/admin/microservices", { headers })
      if (response.ok) {
        const data = await response.json()
        setMicroservices(data.microservices || [])
        if (data.microservices && data.microservices.length > 0 && !selectedMicroservice) {
          setSelectedMicroservice(data.microservices[0].app_code)
        }
      }
    } catch (error) {
      console.error("Error fetching microservices:", error)
      toast({
        title: "Error",
        description: "Failed to load microservices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchNavigationItems = async () => {
    if (!selectedMicroservice) return

    setLoading(true)
    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      }

      const response = await fetch(`/api/admin/navigation-items?microservice=${selectedMicroservice}`, { headers })
      if (response.ok) {
        const data = await response.json()
        const items = (data.navigationItems || []).map((item: any) => {
          // Convert number (1/0) to boolean (true/false)
          const isActive = Boolean(item.is_active === 1 || item.is_active === true)
          const isCollapsible = Boolean(item.is_collapsible === 1 || item.is_collapsible === true)
          
          return {
            ...item,
            order_index: item.order_index,
            orderIndex: item.order_index,
            is_active: isActive,
            isActive: isActive,
            is_collapsible: isCollapsible,
            isCollapsible: isCollapsible,
            item_type: item.item_type,
            itemType: item.item_type,
            parent_navigation_id: item.parent_navigation_id,
            parentNavigationId: item.parent_navigation_id,
            parent_title: item.parent_title,
            parentTitle: item.parent_title,
            subcategory: item.subcategory,
            permission_required: item.permission_required,
            permissionRequired: item.permission_required,
          }
        })
        setNavigationItems(items)
      } else {
        throw new Error("Failed to fetch navigation items")
      }
    } catch (error) {
      console.error("Error fetching navigation items:", error)
      toast({
        title: "Error",
        description: "Failed to load navigation items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    if (!selectedMicroservice) return

    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      }

      const response = await fetch(`/api/admin/permissions?microservice=${selectedMicroservice}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({
      code: "",
      title: "",
      url: "",
      icon: "",
      permission_required: "",
      category: "Administration",
      subcategory: "",
      order_index: navigationItems.length > 0 ? Math.max(...navigationItems.map(ni => ni.order_index)) + 1 : 0,
      is_active: true,
      is_collapsible: false,
      item_type: "domain",
      parent_navigation_id: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      title: item.title,
      url: item.url,
      icon: item.icon,
      permission_required: item.permission_required || "",
      category: item.category,
      subcategory: item.subcategory || "",
      order_index: item.order_index,
      is_active: item.is_active,
      is_collapsible: item.is_collapsible,
      item_type: item.item_type,
      parent_navigation_id: item.parent_navigation_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedMicroservice) {
      toast({
        title: "Error",
        description: "Please select a microservice",
        variant: "destructive",
      })
      return
    }

    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        "Content-Type": "application/json",
      }

      const url = editingItem
        ? `/api/admin/navigation-items/${editingItem.id}`
        : `/api/admin/navigation-items`

      const method = editingItem ? "PUT" : "POST"

      const payload = {
        ...formData,
        microservice: selectedMicroservice,
        parent_navigation_id: formData.parent_navigation_id || null,
        permission_required: formData.permission_required || null,
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingItem ? "Navigation item updated" : "Navigation item created",
        })
        setIsDialogOpen(false)
        fetchNavigationItems()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to save navigation item")
      }
    } catch (error) {
      console.error("Error saving navigation item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save navigation item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this navigation item?")) return

    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      }

      const response = await fetch(`/api/admin/navigation-items/${id}`, {
        method: "DELETE",
        headers,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Navigation item deleted",
        })
        fetchNavigationItems()
      } else {
        throw new Error("Failed to delete navigation item")
      }
    } catch (error) {
      console.error("Error deleting navigation item:", error)
      toast({
        title: "Error",
        description: "Failed to delete navigation item",
        variant: "destructive",
      })
    }
  }

  const handleOrderChange = async (item: NavigationItem, direction: "up" | "down") => {
    const currentIndex = item.order_index
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    // Find item at new position
    const targetItem = navigationItems.find(ni => ni.order_index === newIndex && ni.category === item.category)
    if (!targetItem) return

    try {
      const headers: HeadersInit = {
        "x-user-email": user?.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user?.id || "",
        "x-user-name": `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        "Content-Type": "application/json",
      }

      // Swap order indices
      await Promise.all([
        fetch(`/api/admin/navigation-items/${item.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ ...item, order_index: newIndex }),
        }),
        fetch(`/api/admin/navigation-items/${targetItem.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ ...targetItem, order_index: currentIndex }),
        }),
      ])

      fetchNavigationItems()
    } catch (error) {
      console.error("Error changing order:", error)
      toast({
        title: "Error",
        description: "Failed to change order",
        variant: "destructive",
      })
    }
  }

  // Get parent items (items without parents, for dropdown)
  const parentItems = navigationItems.filter(ni => !ni.parent_navigation_id && ni.id !== editingItem?.id && ni.item_type === 'domain')

  // Group items by category
  const itemsByCategory = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, NavigationItem[]>)

  // Sort items within each category
  Object.keys(itemsByCategory).forEach(category => {
    itemsByCategory[category].sort((a, b) => a.order_index - b.order_index)
  })

  if (!isLoaded) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage navigation items and menu structure</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMicroservice} onValueChange={setSelectedMicroservice}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select microservice" />
            </SelectTrigger>
            <SelectContent>
              {microservices.map((ms) => (
                <SelectItem key={ms.id} value={ms.app_code}>
                  {ms.app_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreateNew} disabled={!selectedMicroservice}>
            <Plus className="h-4 w-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      ) : navigationItems.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No navigation items found. Create your first item to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(itemsByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>{items.length} item(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Collapsible</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOrderChange(item, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.order_index}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOrderChange(item, "down")}
                            disabled={index === items.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="font-mono text-sm">{item.url}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.item_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.is_collapsible ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.parent_title ? (
                          <span className="text-sm text-muted-foreground">{item.parent_title}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Navigation Item" : "Create Navigation Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the navigation item details" : "Create a new navigation item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={!!editingItem}
                  placeholder="e.g., system_admin"
                />
                <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, underscores)</p>
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., System Administration"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g., /system-admin"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="icon">Icon *</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., Settings"
                />
                <p className="text-xs text-muted-foreground mt-1">Lucide icon name (PascalCase)</p>
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Administration"
                />
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_type">Item Type *</Label>
                <Select
                  value={formData.item_type}
                  onValueChange={(value) => setFormData({ ...formData, item_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="button">Button</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Domain: Menu item style | Button: Standalone action
                </p>
              </div>
              <div>
                <Label htmlFor="order_index">Order Index *</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="parent_navigation_id">Parent Item</Label>
              <Select
                value={formData.parent_navigation_id || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, parent_navigation_id: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level item)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top-level item)</SelectItem>
                  {parentItems.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.title} ({parent.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="permission_required">Permission Required</Label>
              <Select
                value={formData.permission_required || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, permission_required: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No permission required" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No permission required</SelectItem>
                  {permissions.map((perm) => (
                    <SelectItem key={perm.id} value={perm.permission_code}>
                      {perm.permission_name} ({perm.permission_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_collapsible"
                  checked={formData.is_collapsible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_collapsible: checked === true })}
                />
                <Label htmlFor="is_collapsible">Collapsible (shows sub-items when expanded)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

