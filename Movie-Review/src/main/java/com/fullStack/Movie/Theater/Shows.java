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
    private int capacity;
    
}
