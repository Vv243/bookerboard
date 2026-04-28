import { createContext, useContext, useState, ReactNode } from 'react'
import type { AuthState, User } from '../types/index'

interface AuthContextType {
    auth: AuthState
    login: (token: string, user: User) => void
    logout: () => void
    isCreativeDirector: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>({
        token: localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user') || 'null'),
    })

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setAuth({ token, user })
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuth({ token: null, user: null })
    }

    const isCreativeDirector = () => 
        auth.user?.userRole === 'creative_director'
    

    return (
        <AuthContext.Provider value = {{ auth, login, logout, isCreativeDirector }}>   
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if(!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}