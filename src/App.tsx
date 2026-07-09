import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'

const Schedule = lazy(() => import('@/pages/Schedule'))
const Marketplace = lazy(() => import('@/pages/Marketplace'))
const Swaps = lazy(() => import('@/pages/Swaps'))
const WhosWorking = lazy(() => import('@/pages/WhosWorking'))
const Team = lazy(() => import('@/pages/Team'))
const Locations = lazy(() => import('@/pages/Locations'))
const Messages = lazy(() => import('@/pages/Messages'))
const Availability = lazy(() => import('@/pages/Availability'))
const Leave = lazy(() => import('@/pages/Leave'))
const Clock = lazy(() => import('@/pages/Clock'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Profile = lazy(() => import('@/pages/Profile'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Activity = lazy(() => import('@/pages/Activity'))
const Admin = lazy(() => import('@/pages/Admin'))
const Assistant = lazy(() => import('@/pages/Assistant'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/swaps" element={<Swaps />} />
        <Route path="/whos-working" element={<WhosWorking />} />
        <Route path="/team" element={<Team />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/clock" element={<Clock />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
