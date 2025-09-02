package com.fullStack.Movie.login;
import java.util.List;
import org.bson.types.ObjectId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "UserData")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Login {

    @Id
    private ObjectId id;
    private String name;
    private String email;
    private String password;
    
}
