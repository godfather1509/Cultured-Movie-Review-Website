package com.fullStack.Movie.Theater;

import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ShowService {

    @Autowired
    private ShowsRepository showsRepository;

    public List<Shows> allShows(String theaterId, String movieId) {
        return showsRepository.findByTheaterIdAndMovieId(theaterId, movieId);
    }

    public List<Shows> showsByTheater(String theaterId) {
        return showsRepository.findByTheaterId(theaterId);
    }

    public Shows createShow(String theaterId, String movieId, int capacity, String time, String screen) {
        Shows show = new Shows(theaterId, movieId, capacity, time, screen);
        return showsRepository.insert(show);
    }

    public Shows createShow(String theaterId, String movieId, int capacity, String time, String screen, Integer price) {
        Shows show = new Shows(theaterId, movieId, capacity, time, screen, "", price != null ? price : 180);
        return showsRepository.insert(show);
    }

    public boolean deleteShow(String showId) {
        try {
            showsRepository.deleteById(new ObjectId(showId));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Shows findShow(String showId, String theaterId, String movieId, String screen, String time) {
        Shows show = null;
        if (showId != null && !showId.isBlank()) {
            try {
                show = showsRepository.findById(new ObjectId(showId)).orElse(null);
            } catch (Exception ignored) {}
        }
        if (show == null && theaterId != null && movieId != null && screen != null && time != null) {
            List<Shows> list = showsRepository.findByTheaterIdAndMovieIdAndScreenAndTime(theaterId, movieId, screen, time);
            if (!list.isEmpty()) show = list.get(0);
        }
        if (show == null && movieId != null && screen != null && time != null) {
            List<Shows> list = showsRepository.findByMovieIdAndScreenAndTime(movieId, screen, time);
            if (!list.isEmpty()) show = list.get(0);
        }
        if (show == null && theaterId != null && movieId != null) {
            List<Shows> list = showsRepository.findByTheaterIdAndMovieId(theaterId, movieId);
            if (!list.isEmpty()) show = list.get(0);
        }
        return show;
    }

    public Shows reserveSeatsForShow(String showId, String theaterId, String movieId, String screen, String time, List<String> seats) {
        Shows show = findShow(showId, theaterId, movieId, screen, time);
        if (show != null) {
            show.addBookedSeats(seats);
            return showsRepository.save(show);
        }
        return null;
    }

    public Shows freeSeatsForShow(String showId, String theaterId, String movieId, String screen, String time, List<String> seats) {
        Shows show = findShow(showId, theaterId, movieId, screen, time);
        if (show != null) {
            show.removeBookedSeats(seats);
            return showsRepository.save(show);
        }
        return null;
    }

    public Shows updateBookedSeats(String showId, String bookedSeats) {
        try {
            Shows show = showsRepository.findById(new ObjectId(showId)).orElse(null);
            if (show != null) {
                show.setBookedSeats(bookedSeats != null ? bookedSeats.trim() : "");
                return showsRepository.save(show);
            }
        } catch (Exception ignored) {}
        return null;
    }
}
