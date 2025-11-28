"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Define the User type based on the database schema
interface User {
  id: number
  name: string
  phone: string
  email: string
  preferred_language: string
  date_of_birth: string // This is 'joinDate' in the old mock data
  notes?: string
}

// UserForm component for adding and editing users
function UserForm({
  user,
  onSave,
  onClose,
}: {
  user: Partial<User> | null
  onSave: (user: Partial<User>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    phone: "",
    email: "",
    preferred_language: "en",
    date_of_birth: "",
    notes: "",
    ...user,
  })

  useEffect(() => {
    // Format date for input type="date"
    const initialData = { ...user }
    if (initialData.date_of_birth) {
      initialData.date_of_birth = format(new Date(initialData.date_of_birth), "yyyy-MM-dd")
    }
    setFormData({
      name: "",
      phone: "",
      email: "",
      preferred_language: "en",
      date_of_birth: "",
      notes: "",
      ...initialData,
    })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={!!user} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user?.id ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date_of_birth" className="text-right">
              Birth Date
            </Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferred_language" className="text-right">
              Language
            </Label>
            <select
              id="preferred_language"
              name="preferred_language"
              value={formData.preferred_language}
              onChange={handleChange}
              className="col-span-3 block w-full rounded-md border-input bg-background p-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null)

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await api.getUsers()
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      // You might want to show an error to the user
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.deleteUser(userId)
        setUsers(users.filter((user) => user.id !== userId))
      } catch (error) {
        console.error("Failed to delete user:", error)
      }
    }
  }

  const handleSaveUser = async (user: Partial<User>) => {
    try {
      // Sanitize data before sending to backend
      const userToSave = {
        ...user,
        // Convert empty strings to null for optional fields
        email: user.email || null,
        date_of_birth: user.date_of_birth || null,
        notes: user.notes || null,
      }

      if (user.id) {
        // Update existing user
        await api.updateUser(user.id, userToSave)
      } else {
        // Create new user
        await api.createUser(userToSave)
      }
      setEditingUser(null)
      fetchUsers() // Refetch users to see the changes
    } catch (error) {
      console.error("Failed to save user:", error)
      alert("Failed to save user. Please check the console for details.")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="users" />
      <Header />
      <main className=" mt-20 space-y-8 p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage your contacts and recipients</p>
          </div>
          <Button className="gap-2" onClick={() => setEditingUser({})}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table Card */}
        <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Language</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Birth Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.phone}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.preferred_language === "ar" ? "default" : "secondary"}>
                        {user.preferred_language.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.date_of_birth ? format(new Date(user.date_of_birth), "PPP") : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} title="Edit User">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            {/* Pagination buttons can be implemented here if needed */}
          </div>
        </Card>
      </main>

      {/* Add/Edit User Form Dialog */}
      {editingUser && <UserForm user={editingUser} onSave={handleSaveUser} onClose={() => setEditingUser(null)} />}
    </div>
  )
}
