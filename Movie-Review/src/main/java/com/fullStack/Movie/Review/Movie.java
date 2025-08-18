package com.fullStack.Movie.Review;
import org.bson.types.ObjectId;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "MovieAPI") // collections should match with MongoDB collection name
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Movie {
    // this is similar to django's models.py it defines our database fields 
    @Id 
    // annotating id field makes it a unique property inside database
    private ObjectId id;
    private String imdbId;
    private String title;
    private String releaseDate;
    private String trailerLink;
    private String poster;
    private List<String> genres;
    private List<String> backdrops;

    @DocumentReference
    private List<Review> reviewIds;
    // this makes it a dependent relationship
    // all reviews written for a movie will be added to this list of reviews
}
