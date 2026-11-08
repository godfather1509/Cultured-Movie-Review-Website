import { useEffect, useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Home from './components/Home'
import Navbar from './components/Navbar'
import LogIn from './components/Login'
import Register from './components/Register'
import MoviePage from './components/MoviePage'
import NotFound from './components/NotFound'
import Theaters from './components/Theaters'
import Screen from './components/Screen'
import Checkout from './components/Checkout'
import TheaterDashboard from './components/TheaterDashboard'
import MyBookings from './components/MyBookings'
import { AuthProvider } from './context/AuthContext'

function App() {

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element:
          <>
            <Navbar />
            <Home />
          </>
      },
      {
        path: "/login",
        element: <>
          <Navbar />
          <LogIn />
        </>
      },
      {
        path: "/register",
        element: <>
          <Navbar />
          <Register />
        </>
      },
      {
        path: "/movie/:movieTitle/:imdbId",
        element: <>
          <Navbar />
          <MoviePage />
        </>
      },
      {
        path: "/theaters/:movieTitle/:imdbId",
        element: <>
          <Navbar />
          <Theaters />
        </>
      },
      {
        path: "/theater/screen/:theaterName/:screen/:capacity",
        element: <>
          <Navbar />
          <Screen />
        </>
      },
      {
        path: "/theater/checkout/:theaterName",
        element: <>
          <Navbar />
          <Checkout />
        </>
      },
      {
        path: "/my-tickets",
        element: <>
          <Navbar />
          <MyBookings />
        </>
      },
      {
        path: "/bookings",
        element: <>
          <Navbar />
          <MyBookings />
        </>
      },
      {
        path: "/theater-dashboard",
        element: <>
          <Navbar />
          <TheaterDashboard />
        </>
      },
      {
        path: "/admin",
        element: <>
          <TheaterDashboard />
        </>
      },
      {
        path: "*",
        element: <>
          <Navbar />
          <NotFound />
        </>
      }
    ]
  )

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
