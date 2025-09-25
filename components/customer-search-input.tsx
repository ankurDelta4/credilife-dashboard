"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, User, Loader2 } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  phone_number: string
}

interface CustomerSearchInputProps {
  value: string
  onChange: (customerId: string, customerName: string) => void
  placeholder?: string
  label?: string
  required?: boolean
}

export function CustomerSearchInput({ 
  value, 
  onChange, 
  placeholder = "Type to search customer by name...",
  label = "Select Customer",
  required = false 
}: CustomerSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState("")
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomers([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (data.success && data.data?.users) {
        setCustomers(data.data.users)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error("Error searching customers:", error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchCustomers(searchQuery)
      }, 300)
      setDebounceTimer(timer)
    } else {
      setCustomers([])
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [searchQuery])

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerName(customer.name)
    setSearchQuery(customer.name)
    onChange(customer.id.toString(), customer.name)
    setShowResults(false)
    setCustomers([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)
    
    if (query !== selectedCustomerName) {
      onChange("", "")
      setSelectedCustomerName("")
    }
  }

  const handleInputFocus = () => {
    if (searchQuery.length >= 2 && !selectedCustomerName) {
      setShowResults(true)
      searchCustomers(searchQuery)
    }
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowResults(false)
    }, 200)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="customer-search">
        {label} {required && "*"}
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-8"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {showResults && (customers.length > 0 || (searchQuery.length >= 2 && !loading)) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectCustomer(customer)
                  }}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No customers found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
      {value && selectedCustomerName && (
        <p className="text-sm text-green-600">
          Selected: {selectedCustomerName} (ID: {value})
        </p>
      )}
    </div>
  )
}