package com.fullStack.Movie.login;

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
    private String role = "USER"; // "USER" or "THEATER"
    private String theaterId;
    private String theaterName;

    public String getUserId() {
        return id != null ? id.toHexString() : null;
    }

    public Login(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role != null ? role : "USER";
    }

    public Login(String name, String email, String password, String role, String theaterId, String theaterName) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role != null ? role : "USER";
        this.theaterId = theaterId;
        this.theaterName = theaterName;
    }
}
