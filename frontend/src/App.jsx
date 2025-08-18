import { useEffect, useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import api from './api/apiConfig'
import Home from './components/Home'
import Navbar from './components/Navbar'
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
