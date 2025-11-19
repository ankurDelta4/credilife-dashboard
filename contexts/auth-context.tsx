"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  phone_number: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on page load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const userData = localStorage.getItem('auth-user')
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        
        // Verify token is still valid by making a test API call
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          setUser(parsedUser)
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('auth-token')
          localStorage.removeItem('auth-user')
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (data.success && data.data.user) {
        const userData = data.data.user

        // Check if user has admin, manager, or agent role
        if (!['admin', 'manager', 'agent'].includes(userData.role)) {
          return {
            success: false,
            error: 'Access denied. Staff privileges required.'
          }
        }

        // Store auth data
        const token = data.data.token || `auth-${Date.now()}`
        localStorage.setItem('auth-token', token)
        localStorage.setItem('auth-user', JSON.stringify(userData))

        setUser(userData)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: data.error || 'Invalid credentials. Please check your email and password.' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}