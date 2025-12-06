package com.fullStack.Movie.Theater;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface ShowsRepository extends MongoRepository<Shows, ObjectId>{

    List<Shows>findByTheaterIdAndMovieId(String theaterId, String movieId);
    
}