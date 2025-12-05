package com.fullStack.Movie.Theater;

import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ShowService {

    @Autowired
    private ShowsRepository showsRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public Optional<Shows> allShows(ObjectId theaterId, ObjectId movieId) {
        return showsRepository.getShowsById(theaterId, movieId);
    }

    public Shows createShow(String theaterId, String movieId, int capacity, String time) {

        Shows show=new Shows(theaterId, movieId, capacity, time);

        showsRepository.insert(show);

        mongoTemplate.update(Theater.class)
        .matching(Criteria.where("id").is(theaterId))
        .apply(new Update().push("shows").value(show))
        .first();

        return show;
    }
    
}
