package com.fullStack.Movie.Theater;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "shows")
@Data
@AllArgsConstructor
@NoArgsConstructor
class Shows {

    @Id
    private ObjectId id;

    private String movieId;
    private String theaterId;
    private int capacity;
    private String bookedSeats;
    private String time;
    private String screen;

    public Shows(String theaterId, String movieId, int capacity, String time, String screen){
        this.movieId=movieId;
        this.capacity=capacity;
        this.theaterId=theaterId;
        this.time=time;
        this.screen=screen;
        }
    
}
