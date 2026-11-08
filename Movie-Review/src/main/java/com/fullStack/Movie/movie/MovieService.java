package com.fullStack.Movie.movie;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.Review.Review;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    public List<Movie> allMovies(){
        return movieRepository.findAll();
    }

    public Optional<Movie> singleMovie(ObjectId id){
        return movieRepository.findById(id);
    }

    public Optional<Movie> singleMovieImdb(String imdbId){
        return movieRepository.findMovieByImdbId(imdbId);
    }

    public boolean deleteMovie(String imdbId) {
        Optional<Movie> movieOpt = movieRepository.findMovieByImdbId(imdbId);
        if (movieOpt.isPresent()) {
            movieRepository.delete(movieOpt.get());
            return true;
        }
        return false;
    }

    public Movie createMovie(String imdbId, String title, String releaseDate, String trailerLink, String poster, List<String> genres, List<String> backdrops) {
        Movie movie = new Movie();
        movie.setImdbId(imdbId);
        movie.setTitle(title);
        movie.setReleaseDate(releaseDate);
        movie.setTrailerLink(trailerLink);
        movie.setPoster(poster);
        movie.setGenres(genres != null ? genres : new ArrayList<>());
        movie.setBackdrops(backdrops != null ? backdrops : new ArrayList<>());
        movie.setAvgRating(5);
        movie.setReviewIds(new ArrayList<>());
        return movieRepository.insert(movie);
    }

    public Movie updateAvgRating(String imdbId){
        Optional<Movie> movieOpt = movieRepository.findMovieByImdbId(imdbId);

        if(movieOpt.isEmpty()){
            throw new RuntimeException("Movie not found: " + imdbId);
        }
        Movie movie = movieOpt.get();

        List<Review> reviews = movie.getReviewIds();
        if (reviews == null || reviews.isEmpty()) {
            return movie;
        }

        long rating = 0;
        for(Review review : reviews){
            rating += Integer.parseInt(review.getRating());
        }

        long avgRating = rating / reviews.size();
        movie.setAvgRating(avgRating);

        return movieRepository.save(movie);
    }
}
