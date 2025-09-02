package com.fullStack.Movie.review;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "reviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Review {

    @Id
    private ObjectId id;
    private String body;
    private String title;
    private String rating;
    LocalDate createdAt;
    // defining Review model

    public Review(String body, String title, String rating){
        // here constructor accepts review body and saves it in database
        this.title=title;
        this.body=body;
        this.rating=rating;
        this.createdAt=LocalDate.now();
    }
// this creates reviews collection in database and defines fields

}