package com.fullStack.Movie.Theater;

import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface ShowsRepository extends MongoRepository<Shows, ObjectId>{

    Optional<Shows>getShowsById(ObjectId theaterId, ObjectId movieId);
    
}