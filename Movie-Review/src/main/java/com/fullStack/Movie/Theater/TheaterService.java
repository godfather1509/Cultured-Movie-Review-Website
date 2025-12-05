package com.fullStack.Movie.Theater;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.movie.Movie;
import com.fullStack.Movie.movie.MovieService;

@Service
public class TheaterService {

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    MovieService movieService;

    public Optional<Theater> theatersById(String movieId) {
        return theaterRepository.findTheaterById(movieId);
    }

    public Theater createTheater(String name, String location, List<String> movieIds) {

        Theater theater = new Theater(name, location, movieIds);
        theaterRepository.insert(theater);

        for (String imdbId : movieIds) {
            mongoTemplate.update(Movie.class)
                    .matching(Criteria.where("imdbId").is(imdbId))
                    .apply(new Update().push("theaterIds").value(theater)).first();
        }
        return theater;
    }

}
