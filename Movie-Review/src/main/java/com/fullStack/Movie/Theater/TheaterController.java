package com.fullStack.Movie.Theater;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/theaters")
public class TheaterController {

    @Autowired
    private TheaterService theaterService;

    @Autowired
    private ShowService showService;

    @Autowired
    private TheaterDatabaseSeeder theaterDatabaseSeeder;

    // Get all theaters in the system
    @GetMapping
    public ResponseEntity<List<Theater>> getAllTheaters() {
        return new ResponseEntity<>(theaterService.allTheaters(), HttpStatus.OK);
    }

    // Get specific theater details by ID
    @GetMapping("/details/{theaterId}")
    public ResponseEntity<?> getTheaterDetails(@PathVariable("theaterId") String theaterId) {
        Optional<Theater> opt = theaterService.singleTheater(theaterId);
        if (opt.isPresent()) {
            return new ResponseEntity<>(opt.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(Map.of("error", "Theater not found"), HttpStatus.NOT_FOUND);
    }

    // Get theaters showing a specific movie
    @GetMapping("/{movieId}")
    public ResponseEntity<List<Theater>> getTheatersByMovieId(@PathVariable("movieId") String movieId) {
        return new ResponseEntity<>(theaterService.theatersById(movieId), HttpStatus.OK);
    }

    // Get all shows for a specific theater
    @GetMapping("/shows/{theaterId}")
    public ResponseEntity<List<Shows>> getShowsByTheater(@PathVariable("theaterId") String theaterId) {
        return new ResponseEntity<>(showService.showsByTheater(theaterId), HttpStatus.OK);
    }

    // Get shows for a theater showing a movie
    @GetMapping("/{movieId}/{theaterId}")
    public ResponseEntity<List<Shows>> getShows(@PathVariable("theaterId") String theaterId, @PathVariable("movieId") String movieId) {
        return new ResponseEntity<>(showService.allShows(theaterId, movieId), HttpStatus.OK);
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/createTheater")
    public ResponseEntity<Theater> createTheater(@RequestBody Map<String, Object> payload) {
        String theaterName = (String) payload.get("theaterName");
        String location = (String) payload.get("location");
        List<String> movieIds = payload.containsKey("movieId") ? (List<String>) payload.get("movieId") : new ArrayList<>();
        
        Integer screenCount = payload.containsKey("screenCount") ? Integer.parseInt(payload.get("screenCount").toString()) : 2;
        List<ScreenConfig> screenConfigs = new ArrayList<>();

        if (payload.containsKey("screens") && payload.get("screens") instanceof List) {
            List<Map<String, Object>> rawScreens = (List<Map<String, Object>>) payload.get("screens");
            for (Map<String, Object> s : rawScreens) {
                String sName = (String) s.getOrDefault("screenName", "Screen 1");
                int cap = Integer.parseInt(s.getOrDefault("capacity", 64).toString());
                int spr = Integer.parseInt(s.getOrDefault("seatsPerRow", 8).toString());
                String layout = (String) s.getOrDefault("layoutType", "Standard");
                screenConfigs.add(new ScreenConfig(sName, cap, spr, layout));
            }
        }

        Theater theater = theaterService.createTheater(theaterName, location, movieIds, screenCount, screenConfigs);
        return new ResponseEntity<>(theater, HttpStatus.CREATED);
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/{theaterId}")
    public ResponseEntity<Theater> updateTheater(@PathVariable("theaterId") String theaterId, @RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String location = (String) payload.get("location");
        Integer screenCount = payload.containsKey("screenCount") ? Integer.parseInt(payload.get("screenCount").toString()) : null;

        List<ScreenConfig> screenConfigs = null;
        if (payload.containsKey("screens") && payload.get("screens") instanceof List) {
            screenConfigs = new ArrayList<>();
            List<Map<String, Object>> rawScreens = (List<Map<String, Object>>) payload.get("screens");
            for (Map<String, Object> s : rawScreens) {
                String sName = (String) s.getOrDefault("screenName", "Screen 1");
                int cap = Integer.parseInt(s.getOrDefault("capacity", 64).toString());
                int spr = Integer.parseInt(s.getOrDefault("seatsPerRow", 8).toString());
                String layout = (String) s.getOrDefault("layoutType", "Standard");
                screenConfigs.add(new ScreenConfig(sName, cap, spr, layout));
            }
        }

        Theater updated = theaterService.updateTheater(theaterId, name, location, screenCount, screenConfigs);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    // Add movie to theater
    @PostMapping("/{theaterId}/addMovie/{movieId}")
    public ResponseEntity<Theater> addMovieToTheater(@PathVariable("theaterId") String theaterId, @PathVariable("movieId") String movieId) {
        return new ResponseEntity<>(theaterService.addMovieToTheater(theaterId, movieId), HttpStatus.OK);
    }

    // Remove movie from theater
    @DeleteMapping("/{theaterId}/removeMovie/{movieId}")
    public ResponseEntity<Theater> removeMovieFromTheater(@PathVariable("theaterId") String theaterId, @PathVariable("movieId") String movieId) {
        return new ResponseEntity<>(theaterService.removeMovieFromTheater(theaterId, movieId), HttpStatus.OK);
    }

    // Delete a theater
    @DeleteMapping("/{theaterId}")
    public ResponseEntity<?> deleteTheater(@PathVariable("theaterId") String theaterId) {
        boolean deleted = theaterService.deleteTheater(theaterId);
        if (deleted) {
            return new ResponseEntity<>(Map.of("message", "Theater deleted successfully"), HttpStatus.OK);
        }
        return new ResponseEntity<>(Map.of("error", "Theater not found"), HttpStatus.NOT_FOUND);
    }

    // Create a new show with pricing
    @PostMapping("/createShows")
    public ResponseEntity<Shows> createShows(@RequestBody Map<String, Object> payload) {
        String theaterId = (String) payload.get("theaterId");
        String movieId = (String) payload.get("movieId");
        int capacity = Integer.parseInt(payload.get("capacity").toString());
        String time = (String) payload.get("showTime");
        String screen = (String) payload.get("screen");
        Integer price = payload.containsKey("price") ? Integer.parseInt(payload.get("price").toString()) : 180;

        return new ResponseEntity<>(
                showService.createShow(theaterId, movieId, capacity, time, screen, price),
                HttpStatus.CREATED);
    }

    // Delete a show
    @DeleteMapping("/shows/{showId}")
    public ResponseEntity<?> deleteShow(@PathVariable("showId") String showId) {
        boolean deleted = showService.deleteShow(showId);
        if (deleted) {
            return new ResponseEntity<>(Map.of("message", "Show deleted successfully"), HttpStatus.OK);
        }
        return new ResponseEntity<>(Map.of("error", "Failed to delete show"), HttpStatus.BAD_REQUEST);
    }

    // Update booked seats for a show (e.g. theater manager quick adjustment / sold out toggle)
    @PutMapping("/shows/{showId}/booked-seats")
    public ResponseEntity<?> updateShowBookedSeats(@PathVariable("showId") String showId, @RequestBody Map<String, String> payload) {
        String seats = payload.get("bookedSeats");
        Shows updated = showService.updateBookedSeats(showId, seats);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Show not found or could not update"));
    }

    // Trigger seeding theaters & shows for all movies in database on-demand
    @PostMapping("/seedAllMovies")
    public ResponseEntity<Map<String, Object>> seedTheatersAndShows() {
        Map<String, Object> result = theaterDatabaseSeeder.seedAllMovies();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/seedAllMovies")
    public ResponseEntity<Map<String, Object>> seedTheatersAndShowsGet() {
        Map<String, Object> result = theaterDatabaseSeeder.seedAllMovies();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
