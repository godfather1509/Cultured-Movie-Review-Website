package com.fullStack.Movie.Review;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// @CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/movies") // this enable request handling
// this is an api end point
public class MovieController {
    // this class handels https response from frontend 
    // it sends received data to services class and vice versa

    @Autowired
    private MovieService movieService;
    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies(){
        return new ResponseEntity<List<Movie>>(movieService.allMovies(), HttpStatus.OK);
    }    
    // This is Rest api controller 

    @GetMapping("/{id}") // this tells program that function will accept only GET request
    public ResponseEntity<Optional<Movie>> getsingleMovie(@PathVariable ObjectId id){
        // Using 'optional' allows us to return either a null value or the specified datatype.
        // this function returns data on basis of Id
        return new ResponseEntity<Optional<Movie>>(movieService.singleMovie(id),HttpStatus.OK);

    }

    @GetMapping("imdb/{imdbId}")
    public ResponseEntity<Optional<Movie>> getsingleMovie(@PathVariable String imdbId){
        // Using 'optional' allows us to return either a null value or the specified datatype.
        // this function detects data on basis of imdb id
        return new ResponseEntity<Optional<Movie>>(movieService.singleMovieImdb(imdbId),HttpStatus.OK);
    }
}
