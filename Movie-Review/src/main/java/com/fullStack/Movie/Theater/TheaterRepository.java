package com.fullStack.Movie.Theater;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface TheaterRepository extends MongoRepository<Theater, ObjectId>{
        List<Theater> findByMovieIdsContaining(String movieId);    
}
