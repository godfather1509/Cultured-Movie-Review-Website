package com.fullStack.Movie.Review;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/movie/review")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;
    /*
    @Autowired annotations creates instance of given class at start of the program we can retriving it when required
    */

    @PostMapping("/send")
    // this tells program that function will accept only "POST" request
    public ResponseEntity<Review> createReview(@RequestBody Map<String, String> payload){
        return new ResponseEntity<Review>(reviewService.creatReviewBy(payload.get("reviewBody"), payload.get("imdbId"), payload.get("title"), payload.get("rating")),HttpStatus.CREATED);
    }   


}