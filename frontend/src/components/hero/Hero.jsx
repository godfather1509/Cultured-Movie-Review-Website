import './Hero.css'
import Carousel from 'react-material-ui-carousel'
import { Paper, Button } from '@mui/material'
import { useContext } from 'react'
import movieContext from '../contexts/movieContext'

const Hero = () => {
    const { movies } = useContext(movieContext)

    return (
        <div className="movie-carousel-container">
            <Carousel>
                {movies.map((movie, index) => (
                    <Paper key={index} className="movie-card-container">
                        <div className="movie-card" style={{ "--img": `url(${movie.backdrops[0]})` }}>
                            <div className="movie-overlay">
                                <div className="poster-box">
                                    <img src={movie.poster} alt={movie.title} className="movie-poster" />
                                </div>
                                <div className="movie-info">
                                    <h2 className="movie-title">{movie.title}</h2>
                                    <p className="movie-review">{movie.review}</p>
                                    <Button variant="contained" color="secondary" className="book-button">
                                        Book Ticket
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Paper>
                ))}
            </Carousel>
        </div>
    )
}

export default Hero
