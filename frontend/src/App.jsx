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
          <Screen/>
        </>
      },
      {
        path: "/theater/checkout/:theaterName",
        element: <>
          <Navbar />
          <Checkout/>
        </>
      },
      {
        path: "*",
        element: <>
          <NotFound />
        </>
      }
    ]
  )

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
