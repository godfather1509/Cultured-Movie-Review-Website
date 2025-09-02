package com.fullStack.Movie.Review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    MovieService movieService;

    public Review creatReviewBy(String reviewBody, String imdbId, String title, String rating) {
        // this takes review content and imdb id of the movie

        Review review = new Review(reviewBody, title, rating);
        // creates a Review object
        reviewRepository.insert(review);
        // saves it in review collection

        mongoTemplate.update(Movie.class)
                .matching(Criteria.where("imdbId").is(imdbId))
                .apply(new Update().push("reviewIds").value(review))
                .first();
        // here we filter out the movie based on imdb id and save review object there as well
        
        movieService.updateAvgRating(imdbId);
        return review; // return the review object back to controller
    }
}