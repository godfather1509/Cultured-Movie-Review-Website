package com.fullStack.Movie.login;

import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LoginRepository extends MongoRepository<Login, ObjectId> {
    Optional<Login> findByEmail(String email);
    Optional<Login> findByEmailAndPassword(String email, String password);
}

