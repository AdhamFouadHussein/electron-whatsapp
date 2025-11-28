"use client"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface User {
  id: number
  name: string
  phone: string
}

interface UserSearchInputProps {
  users: User[]
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
}

export function UserSearchInput({
  users,
  value,
  onChange,
  error,
  required = false,
  placeholder = "Search by name or phone...",
}: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const user = users.find((u) => u.id.toString() === value)
      setSelectedUser(user || null)
    } else {
      setSelectedUser(null)
    }
  }, [value, users])

  const filteredUsers = users.filter(
    (user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.phone.includes(searchTerm),
  )

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    onChange(user.id.toString())
    setIsOpen(false)
    setSearchTerm("")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label>
        User <span className="text-destructive">*</span>
      </Label>

      <div className="relative">
        <Input
          placeholder={placeholder}
          value={selectedUser ? `${selectedUser.name} (${selectedUser.phone})` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
            onChange("")
          }}
          onFocus={() => setIsOpen(true)}
          className={`border-border/50 pr-10 ${error ? "border-red-500" : ""}`}
        />

        {selectedUser && (
          <button
            onClick={() => {
              setSelectedUser(null)
              onChange("")
              setSearchTerm("")
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border/30 last:border-b-0 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                  {selectedUser?.id === user.id && <div className="h-2 w-2 bg-accent rounded-full" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
