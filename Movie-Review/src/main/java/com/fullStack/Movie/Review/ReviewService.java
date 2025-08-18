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

    public Review creatReviewBy(String reviewBody, String imdbId) {
        // this takes review content and imdb id of the movie

        Review review = new Review(reviewBody); 
        // creates a Review object
        reviewRepository.insert(review);
        // saves it in review collection

        mongoTemplate.update(Movie.class)
                .matching(Criteria.where("imdbId").is(imdbId))
                .apply(new Update().push("reviewIds").value(review))
                .first();
                // here we filter out the movie based on imdb id and save review object there as well

        return review; // return the review object back to controller
    }
}