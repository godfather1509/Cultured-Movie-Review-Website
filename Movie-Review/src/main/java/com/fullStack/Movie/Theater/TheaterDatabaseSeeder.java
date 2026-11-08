package com.fullStack.Movie.Theater;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.fullStack.Movie.movie.Movie;
import com.fullStack.Movie.movie.MovieRepository;

@Component
public class TheaterDatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(TheaterDatabaseSeeder.class);

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private ShowsRepository showsRepository;

    @Override
    public void run(String... args) {
        try {
            logger.info("[Database Seeder] Checking and initializing theater & show data for all movies...");
            seedAllMovies();
        } catch (Exception e) {
            logger.error("[Database Seeder] Error seeding theater data: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> seedAllMovies() {
        Map<String, Object> response = new HashMap<>();

        List<Movie> movies = movieRepository.findAll();
        if (movies == null || movies.isEmpty()) {
            logger.warn("[Database Seeder] No movies found in database yet. Waiting for movies to be added.");
            response.put("status", "skipped");
            response.put("message", "No movies found in database");
            return response;
        }

        List<String> allMovieIds = movies.stream()
                .map(Movie::getImdbId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        logger.info("[Database Seeder] Found {} movies to link with theaters: {}", allMovieIds.size(), allMovieIds);

        // Define template theaters
        List<TheaterTemplate> templates = List.of(
            new TheaterTemplate("PVR ICON: Gold Class & IMAX", "Phoenix Palladium, Lower Parel, Mumbai"),
            new TheaterTemplate("INOX Megaplex: Insignia & Laser", "Inorbit Mall, Malad West, Mumbai"),
            new TheaterTemplate("Cinépolis: VIP Lounge & 4DX", "Viviana Mall, Thane West, Mumbai"),
            new TheaterTemplate("Miraj Cinemas: IMAX 3D", "Wadala East, Mumbai")
        );

        int theatersCreatedOrUpdated = 0;
        int showsCreated = 0;

        List<Theater> existingTheaters = theaterRepository.findAll();

        for (TheaterTemplate template : templates) {
            // Find or create theater
            Optional<Theater> existingOpt = existingTheaters.stream()
                    .filter(t -> t.getName() != null && t.getName().equalsIgnoreCase(template.name))
                    .findFirst();

            Theater theater;
            if (existingOpt.isPresent()) {
                theater = existingOpt.get();
                List<String> currentMovieIds = theater.getMovieIds() != null ? new ArrayList<>(theater.getMovieIds()) : new ArrayList<>();
                boolean updated = false;
                for (String mId : allMovieIds) {
                    if (!currentMovieIds.contains(mId)) {
                        currentMovieIds.add(mId);
                        updated = true;
                    }
                }
                if (updated) {
                    theater.setMovieIds(currentMovieIds);
                    theaterRepository.save(theater);
                }
            } else {
                theater = new Theater(template.name, template.location, new ArrayList<>(allMovieIds));
                theater = theaterRepository.insert(theater);
                theatersCreatedOrUpdated++;
            }

            String theaterId = theater.getTheaterId();

            // For each movie, verify/create shows
            for (String movieId : allMovieIds) {
                List<Shows> existingShows = showsRepository.findByTheaterIdAndMovieId(theaterId, movieId);
                if (existingShows == null || existingShows.isEmpty()) {
                    List<Shows> newShows = List.of(
                        new Shows(theaterId, movieId, 64, "10:30 AM", "Screen 1 (Laser 4K)", "A1,A2,C4", 180),
                        new Shows(theaterId, movieId, 80, "01:45 PM", "Screen 2 (Dolby Atmos)", "B3,B4,D5,D6", 240),
                        new Shows(theaterId, movieId, 64, "05:15 PM", "Screen 1 (Laser 4K)", "A3,A4,C1,C2", 180),
                        new Shows(theaterId, movieId, 80, "08:45 PM", "Screen 2 (Dolby Atmos)", "E1,E2,E3,E4", 260),
                        new Shows(theaterId, movieId, 72, "11:15 PM", "Screen 3 (IMAX)", "B1,B2,F5", 320)
                    );
                    showsRepository.saveAll(newShows);
                    showsCreated += newShows.size();
                }
            }
        }

        logger.info("[Database Seeder] Seeding finished. Processed {} movies, created {} shows across {} theaters.",
                allMovieIds.size(), showsCreated, templates.size());

        response.put("status", "success");
        response.put("moviesCount", allMovieIds.size());
        response.put("theatersCount", templates.size());
        response.put("showsCreated", showsCreated);
        response.put("message", "Theater and show data successfully initialized for all movies");
        return response;
    }

    private static class TheaterTemplate {
        String name;
        String location;

        TheaterTemplate(String name, String location) {
            this.name = name;
            this.location = location;
        }
    }
}
