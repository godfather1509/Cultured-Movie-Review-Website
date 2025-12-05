package com.fullStack.Movie.Theater;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

// import com.fullStack.Movie.movie.Movie;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "theaters")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Theater {
    @Id
    private ObjectId id;

    private String name;
    private String location;
    private List<String> movieIds;

    public Theater(String name, String location, List<String> movieIds){
        this.name=name;
        this.location=location;
        this.movieIds=movieIds;
    }

    @DocumentReference
    private List<Shows> shows;

}
