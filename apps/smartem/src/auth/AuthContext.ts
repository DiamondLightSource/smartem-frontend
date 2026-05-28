import { createContext, useContext } from 'react'
import type { Auth } from './types'

export const defaultAuth: Auth = {
  initialised: false,
  authenticated: false,
  login: () => {},
  logout: () => {},
  getToken: () => '',
}

export const AuthContext = createContext<Auth>(defaultAuth)

export const useAuth = () => useContext(AuthContext)
