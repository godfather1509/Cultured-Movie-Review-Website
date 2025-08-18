import { useEffect, useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import api from './api/apiConfig'
import Home from './components/Home'
import Navbar from './components/Navbar'
import About from './components/About'
import LogIn from './components/Login'
import Register from './components/Register'
import NotFound from './components/NotFound'

function App() {
  const [movies, setMovies] = useState([])

  const getMovies = async () => {
    try {
      const response = await api.get("/api/v1/movies")
      console.log("Api Response:", response.data)
      setMovies(response.data)
    }
    catch (err) {
      console.log(err)
    }
  }

  useEffect(() => { getMovies() }, [])

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <>
          <Navbar />
          <Home movies={movies} />
        </>
      },
      {
        path: "/about",
        element: <>
          <Navbar />
          <About/>
        </>
      },
      {
        path: "/login",
        element: <>
          <Navbar />
          <LogIn/>
        </>
      },
      {
        path: "/register",
        element: <>
          <Navbar />
          <Register/>
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
