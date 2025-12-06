package com.fullStack.Movie.Theater;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/theaters")
public class TheaterController {

    @Autowired
    private TheaterService theaterService;

    @Autowired
    private ShowService showService;

    @GetMapping("/{movieId}")
    public ResponseEntity<List<Theater>> getTheatersById(@PathVariable String movieId) {
        return new ResponseEntity<List<Theater>>(theaterService.theatersById(movieId), HttpStatus.OK);
    }

    @GetMapping("/{movieId}/{theaterId}")
    public ResponseEntity<List<Shows>> getShows(@PathVariable String theaterId, @PathVariable String movieId) {
        return new ResponseEntity<List<Shows>>(showService.allShows(theaterId,movieId), HttpStatus.OK);
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/createTheater")
    public ResponseEntity<Theater> createTheater(@RequestBody Map<String, Object> payload) {

        String theaterName = (String) payload.get("theaterName");
        String location = (String) payload.get("location");

        // movieId is an array, so cast it properly
        List<String> movieIds = (List<String>) payload.get("movieId");

        return new ResponseEntity<>(
                theaterService.createTheater(theaterName, location, movieIds),
                HttpStatus.CREATED);
    }

    @PostMapping("/createShows")
    public ResponseEntity<Shows> createShows(@RequestBody Map<String, Object> payload) {

        String theaterId = (String) payload.get("theaterId");
        String movieId = (String) payload.get("movieId");
        int capacity = Integer.parseInt(payload.get("capacity").toString());
        String time=(String) payload.get("showTime");
        String screen=(String) payload.get("screen");
        
        return new ResponseEntity<>(
                showService.createShow(theaterId, movieId, capacity, time, screen),
                HttpStatus.CREATED);
    }

}
