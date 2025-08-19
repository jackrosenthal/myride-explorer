import { useState, useEffect } from 'react'
import { SignInPage } from '@toolpad/core/SignInPage'
import { AppProvider } from '@toolpad/core/AppProvider'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { useSession } from '@toolpad/core/useSession'
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip } from '@mui/material'
import { History as HistoryIcon, Home as HomeIcon, DirectionsBus, LocationOn } from '@mui/icons-material'
import type { Session, Navigation, Router } from '@toolpad/core'
import './App.css'

interface User {
  id: string
  name: string
  email: string
}

interface AppSession extends Session {
  user?: User
  signOut?: () => void
}

interface TapHistoryRecord {
  type: string
  doc: {
    displayContext: Array<{ data: string; label: string }>
    scannedAt?: { externalId: string }
    routeId: string
    serverTimestamp: number
    scanId: string
    location: { lon: number; lat: number }
    vehicleId: string
    brand: string
    tokenName: string
    outcome: string
    productName: string
    tripStart: number
    productEnd: number
    mediaFormat: string
    fareBlocks: {
      outcome: string
      trip: Array<{ name: string }>
    }
  }
}

async function getJWTToken(service: string): Promise<string> {
  const response = await fetch('/api/justride/broker/web-api/v1/RTDDENVER/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ service })
  })
  
  if (!response.ok) {
    throw new Error('Failed to get JWT token')
  }
  
  const data = await response.json()
  return data.jwtToken
}

async function fetchTapHistory(accountId: string, jwtToken: string, size = 10): Promise<TapHistoryRecord[]> {
  const endTime = Date.now()
  const startTime = 1 // minimum startTime as per docs
  
  const response = await fetch(
    `/api/justride/edge/data/v2/RTDDENVER/account/${accountId}/history?size=${size}&startTime=${startTime}&endTime=${endTime}`,
    {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch tap history')
  }
  
  const data = await response.json()
  return data.hits || []
}

function TapHistory({ session }: { session: AppSession }) {
  const [history, setHistory] = useState<TapHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      console.log('TapHistory useEffect - session:', session)
      console.log('TapHistory useEffect - user:', session?.user)
      console.log('TapHistory useEffect - user.id:', session?.user?.id)
      
      if (!session?.user?.id) {
        console.log('No user ID found, not loading history')
        setLoading(false)
        return
      }
      
      console.log('Starting to load history for user:', session.user.id)
      setLoading(true)
      setError(null)
      
      console.log('Getting JWT token...')
      const jwtToken = await getJWTToken('data')
      console.log('Got JWT token, fetching history...')
      const historyData = await fetchTapHistory(session.user.id, jwtToken)
      console.log('History data received:', historyData)
      setHistory(historyData)
      setLoading(false)
    }

    loadHistory().catch((err) => {
      console.error('Error loading history:', err)
      setError(err.message)
      setLoading(false)
    })
  }, [session?.user?.id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tap History
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Showing {history.length} recent tap records
      </Typography>
      
      {history.map((record) => (
        <Card key={record.doc.scanId} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsBus color="primary" />
              <Typography variant="h6">Route {record.doc.routeId}</Typography>
              <Chip label={record.doc.outcome} size="small" />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" />
              <Typography variant="body2">
                Vehicle {record.doc.vehicleId} • {record.doc.tokenName}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {new Date(record.doc.serverTimestamp).toLocaleString()}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {record.doc.displayContext.map((context, idx) => (
                <Chip 
                  key={idx} 
                  label={`${context.label}: ${context.data}`} 
                  variant="outlined" 
                  size="small" 
                  sx={{ mr: 1 }}
                />
              ))}
            </Box>
            
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Product: {record.doc.productName} • Media: {record.doc.mediaFormat}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

function HomePage() {
  const session = useSession() as AppSession
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {session?.user?.name}!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Account: {session?.user?.id}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use the navigation menu to explore your MyRide data.
      </Typography>
    </Box>
  )
}

const NAVIGATION: Navigation = [
  {
    segment: '',
    title: 'Home',
    icon: <HomeIcon />,
  },
  {
    segment: 'history',
    title: 'Tap History',
    icon: <HistoryIcon />,
  },
]

function Dashboard({ session }: { session: AppSession }) {
  const [pathname, setPathname] = useState('/')
  
  const router: Router = {
    pathname,
    searchParams: new URLSearchParams(),
    navigate: (url: string | URL) => {
      const path = typeof url === 'string' ? url : url.pathname
      setPathname(path)
    },
  }

  const renderPage = () => {
    switch (pathname) {
      case '/history':
        return <TapHistory session={session} />
      default:
        return <HomePage />
    }
  }

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      branding={{
        title: 'MyRide Explorer',
      }}
      session={session}
    >
      <DashboardLayout>
        {renderPage()}
      </DashboardLayout>
    </AppProvider>
  )
}

function App() {
  const [session, setSession] = useState<AppSession | null>(null)

  const signIn = async (_provider: any, formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    console.log('Attempting login with:', email)
    const authString = btoa(`${email}:${password}`)
    console.log('Auth string:', authString)
    
    const response = await fetch('/api/justride/broker/web-api/v1/RTDDENVER/login', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (response.ok) {
      const data = await response.json()
      const user: User = {
        id: data.account,
        name: data.username,
        email: data.emailAddress
      }
      const newSession: AppSession = { user }
      setSession(newSession)
      return { type: 'CredentialsSignin' as const }
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
  }

  const signOut = () => {
    setSession(null)
  }

  if (session) {
    const sessionWithSignOut = { ...session, signOut } as AppSession
    return <Dashboard session={sessionWithSignOut} />
  }

  return (
    <SignInPage
      signIn={signIn}
      providers={[{
        id: 'credentials',
        name: 'Email and Password'
      }]}
    />
  )
}

export default App
