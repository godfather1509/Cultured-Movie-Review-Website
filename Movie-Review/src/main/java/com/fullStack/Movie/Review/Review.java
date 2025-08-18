package com.fullStack.Movie.Review;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
    // defining Review model

    public Review(String body){
        // here constructor accepts review body and saves it in database
        this.body=body;
    }
// this creates reviews collection in database and defines fields

}