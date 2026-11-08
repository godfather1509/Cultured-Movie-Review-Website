package com.fullStack.Movie.Review;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

@Document(collection = "reviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Review {

    @Id
    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;
    private String body;
    private String title;
    private String rating;
    private LocalDate createdAt;
    private int likes = 0;
    // defining Review model

    public Review(String body, String title, String rating){
        // here constructor accepts review body and saves it in database
        this.title=title;
        this.body=body;
        this.rating=rating;
        this.createdAt=LocalDate.now();
        this.likes=0;
    }

    public String getReviewId() {
        return id != null ? id.toHexString() : null;
    }
// this creates reviews collection in database and defines fields

}