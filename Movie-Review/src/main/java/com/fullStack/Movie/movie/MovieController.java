package com.fullStack.Movie.movie;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies(){
        return new ResponseEntity<List<Movie>>(movieService.allMovies(), HttpStatus.OK);
    }    

    @GetMapping("/{id}")
    public ResponseEntity<Optional<Movie>> getsingleMovie(@PathVariable ObjectId id){
        return new ResponseEntity<Optional<Movie>>(movieService.singleMovie(id), HttpStatus.OK);
    }

    @GetMapping("imdb/{imdbId}")
    public ResponseEntity<Optional<Movie>> getsingleMovie(@PathVariable String imdbId){
        return new ResponseEntity<Optional<Movie>>(movieService.singleMovieImdb(imdbId), HttpStatus.OK);
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Map<String, Object> payload) {
        String imdbId = (String) payload.getOrDefault("imdbId", "tt" + (System.currentTimeMillis() % 10000000));
        String title = (String) payload.get("title");
        String releaseDate = (String) payload.getOrDefault("releaseDate", "2026-01-01");
        String trailerLink = (String) payload.getOrDefault("trailerLink", "");
        String poster = (String) payload.getOrDefault("poster", "");
        List<String> genres = payload.containsKey("genres") ? (List<String>) payload.get("genres") : new ArrayList<>();
        List<String> backdrops = payload.containsKey("backdrops") ? (List<String>) payload.get("backdrops") : new ArrayList<>();

        if (poster != null && !poster.isEmpty() && backdrops.isEmpty()) {
            backdrops.add(poster);
        }

        Movie created = movieService.createMovie(imdbId, title, releaseDate, trailerLink, poster, genres, backdrops);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @DeleteMapping("/{imdbId}")
    public ResponseEntity<?> deleteMovie(@PathVariable("imdbId") String imdbId) {
        boolean deleted = movieService.deleteMovie(imdbId);
        if (deleted) {
            return new ResponseEntity<>(Map.of("message", "Movie deleted successfully"), HttpStatus.OK);
        }
        return new ResponseEntity<>(Map.of("error", "Movie not found"), HttpStatus.NOT_FOUND);
    }
}
