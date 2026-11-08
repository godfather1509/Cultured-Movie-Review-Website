package com.fullStack.Movie.Theater;

import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ShowsRepository extends MongoRepository<Shows, ObjectId> {
    List<Shows> findByTheaterIdAndMovieId(String theaterId, String movieId);
    List<Shows> findByTheaterId(String theaterId);
    List<Shows> findByMovieId(String movieId);
    List<Shows> findByMovieIdAndScreenAndTime(String movieId, String screen, String time);
    List<Shows> findByTheaterIdAndMovieIdAndScreenAndTime(String theaterId, String movieId, String screen, String time);
}
