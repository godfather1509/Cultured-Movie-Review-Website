package com.fullStack.Movie.Theater;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.movie.MovieService;

@Service
public class TheaterService {

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    MovieService movieService;

    public List<Theater> allTheaters() {
        return theaterRepository.findAll();
    }

    public Optional<Theater> singleTheater(String theaterId) {
        try {
            Optional<Theater> opt = theaterRepository.findById(new ObjectId(theaterId));
            if (opt.isPresent()) return opt;
        } catch (Exception ignored) {}
        for (Theater t : theaterRepository.findAll()) {
            if (theaterId != null && (theaterId.equals(t.getTheaterId()) || theaterId.equals(t.getName()))) {
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }

    public List<Theater> theatersById(String movieId) {
        return theaterRepository.findByMovieIdsContaining(movieId);
    }

    public Theater createTheater(String name, String location, List<String> movieIds) {
        Theater theater = new Theater(name, location, movieIds);
        return theaterRepository.insert(theater);
    }

    public Theater createTheater(String name, String location, List<String> movieIds, Integer screenCount, List<ScreenConfig> screens) {
        Theater theater = new Theater(name, location, movieIds, screenCount, screens);
        return theaterRepository.insert(theater);
    }

    public Theater updateTheater(String theaterId, String name, String location, Integer screenCount, List<ScreenConfig> screens) {
        Optional<Theater> opt = singleTheater(theaterId);
        if (opt.isEmpty()) {
            throw new RuntimeException("Theater not found: " + theaterId);
        }
        Theater t = opt.get();
        if (name != null && !name.trim().isEmpty()) t.setName(name.trim());
        if (location != null && !location.trim().isEmpty()) t.setLocation(location.trim());
        if (screenCount != null) t.setScreenCount(screenCount);
        if (screens != null) t.setScreens(screens);
        return theaterRepository.save(t);
    }

    public Theater addMovieToTheater(String theaterId, String movieId) {
        Optional<Theater> opt = singleTheater(theaterId);
        if (opt.isEmpty()) {
            throw new RuntimeException("Theater not found: " + theaterId);
        }
        Theater t = opt.get();
        List<String> current = t.getMovieIds() != null ? new ArrayList<>(t.getMovieIds()) : new ArrayList<>();
        if (!current.contains(movieId)) {
            current.add(movieId);
            t.setMovieIds(current);
            theaterRepository.save(t);
        }
        return t;
    }

    public Theater removeMovieFromTheater(String theaterId, String movieId) {
        Optional<Theater> opt = singleTheater(theaterId);
        if (opt.isEmpty()) {
            throw new RuntimeException("Theater not found: " + theaterId);
        }
        Theater t = opt.get();
        List<String> current = t.getMovieIds() != null ? new ArrayList<>(t.getMovieIds()) : new ArrayList<>();
        if (current.remove(movieId)) {
            t.setMovieIds(current);
            theaterRepository.save(t);
        }
        return t;
    }

    public boolean deleteTheater(String theaterId) {
        Optional<Theater> opt = singleTheater(theaterId);
        if (opt.isPresent()) {
            theaterRepository.delete(opt.get());
            return true;
        }
        return false;
    }
}
