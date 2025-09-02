package com.fullStack.Movie.movie;

import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.Review.Review;

@Service
public class MovieService {
// This is an intermediary between the Controller (which handles HTTP requests) and the Repository (which interacts with the database)
// Services class performs logical operations on data received from Controller sends it to database and vice versa
// Services + Controller together perform function of views.py of django


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

    public Movie updateAvgRating(String imdbId){

        Optional<Movie> movieOpt=movieRepository.findMovieByImdbId(imdbId); // optional data type allows value to be Movie or null

        if(movieOpt.isEmpty()){
            throw new RuntimeException("Movie not found"+imdbId);
        }
        Movie movie=movieOpt.get();

        List<Review> reviews=movie.getReviewIds();

        long rating=0;
        for(Review review:reviews){
            rating+=Integer.parseInt(review.getRating());
        }

        long avgRating=rating/reviews.size();

        movie.setAvgRating(avgRating);

        return movieRepository.save(movie);

    }
    
}
