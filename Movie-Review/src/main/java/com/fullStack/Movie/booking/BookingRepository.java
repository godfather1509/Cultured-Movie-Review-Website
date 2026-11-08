package com.fullStack.Movie.booking;

import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends MongoRepository<Booking, ObjectId> {
    Optional<Booking> findByBookingId(String bookingId);
    List<Booking> findAllByOrderByBookingTimeDesc();
    List<Booking> findByImdbId(String imdbId);
}

