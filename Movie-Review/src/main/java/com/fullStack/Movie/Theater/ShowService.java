package com.fullStack.Movie.Theater;

import java.util.List;
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

    public List<Shows> allShows(String theaterId, String movieId) {
        // System.out.println("Querying for theaterId=" + theaterId + " movieId=" + movieId);
        return showsRepository.findByTheaterIdAndMovieId(theaterId, movieId);
    }

    public Shows createShow(String theaterId, String movieId, int capacity, String time, String screen) {

        Shows show=new Shows(theaterId, movieId, capacity, time, screen);

        showsRepository.insert(show);

        // mongoTemplate.update(Theater.class)
        // .matching(Criteria.where("theaterId").is(theaterId))
        // .apply(new Update().push("shows").value(show))
        // .first();

        return show;
    }
    
}
