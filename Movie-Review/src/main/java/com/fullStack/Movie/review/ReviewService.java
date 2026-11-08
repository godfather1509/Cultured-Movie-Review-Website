package com.fullStack.Movie.Review;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import com.fullStack.Movie.movie.*;

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

    public Review updateReviewLikes(String reviewId, boolean isLike) {
        try {
            ObjectId objId = new ObjectId(reviewId);
            Review review = reviewRepository.findById(objId).orElse(null);
            if (review != null) {
                int currentLikes = review.getLikes();
                int newLikes = isLike ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                review.setLikes(newLikes);
                Review saved = reviewRepository.save(review);

                // Also update any embedded review in Movie.reviewIds matching this id
                try {
                    mongoTemplate.updateMulti(
                        Query.query(Criteria.where("reviewIds._id").is(objId)),
                        new Update().set("reviewIds.$.likes", newLikes),
                        Movie.class
                    );
                } catch (Exception e) {
                    // Ignored if reviewIds are pure DBRefs
                }

                return saved;
            }
        } catch (Exception e) {
            System.err.println("Error updating review likes for id " + reviewId + ": " + e.getMessage());
        }
        return null;
    }
}