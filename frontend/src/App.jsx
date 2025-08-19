import { useEffect, useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import api from './api/apiConfig'
import Home from './components/Home'
import Navbar from './components/Navbar'
import About from './components/About'
import LogIn from './components/Login'
import Register from './components/Register'
import MoviePage from './components/MoviePage'
import NotFound from './components/NotFound'

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
        path: "/about",
        element: <>
          <Navbar />
          <About />
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
