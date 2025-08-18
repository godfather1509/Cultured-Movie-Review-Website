package com.fullStack.Movie.Review;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "*")
public class MovieReviewApplication {
	// MovieReviewApplication class contains the main method it is the entry point to our application
	public static void main(String[] args) {
		SpringApplication.run(MovieReviewApplication.class, args);
	}
}
