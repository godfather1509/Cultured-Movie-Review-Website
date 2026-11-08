package com.fullStack.Movie.login;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fullStack.Movie.Theater.ScreenConfig;
import com.fullStack.Movie.Theater.Theater;
import com.fullStack.Movie.Theater.TheaterRepository;
import com.fullStack.Movie.movie.Movie;
import com.fullStack.Movie.movie.MovieRepository;

@Service
public class LoginService {

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private MovieRepository movieRepository;

    public Map<String, Object> registerUser(String name, String email, String password, String role,
                                            String theaterName, String location, Integer screenCount) {
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.put("error", "Email and password are required");
            return response;
        }

        String cleanEmail = email.trim().toLowerCase();

        if (loginRepository.findByEmail(cleanEmail).isPresent()) {
            response.put("error", "User with this email already exists");
            return response;
        }

        String userRole = "USER";
        if (role != null) {
            if (role.equalsIgnoreCase("ADMIN")) userRole = "ADMIN";
            else if (role.equalsIgnoreCase("THEATER")) userRole = "THEATER";
        }

        String linkedTheaterId = null;
        String linkedTheaterName = null;

        if ("THEATER".equals(userRole)) {
            String tName = (theaterName != null && !theaterName.trim().isEmpty()) ? theaterName.trim() : (name + " Cinema");
            String tLoc = (location != null && !location.trim().isEmpty()) ? location.trim() : "Downtown Cinema Plaza";
            int sCount = screenCount != null && screenCount > 0 ? screenCount : 2;

            // Fetch all movie IDs to link initial catalog
            List<String> movieIds = new ArrayList<>();
            try {
                List<Movie> allM = movieRepository.findAll();
                if (allM != null) {
                    for (Movie m : allM) {
                        if (m.getImdbId() != null) movieIds.add(m.getImdbId());
                    }
                }
            } catch (Exception ignored) {}

            List<ScreenConfig> screens = new ArrayList<>();
            for (int i = 1; i <= sCount; i++) {
                String sType = i == 1 ? "Standard" : (i == 2 ? "IMAX" : "VIP Recliner");
                int cap = i == 2 ? 80 : 64;
                screens.add(new ScreenConfig("Screen " + i + " (" + sType + ")", cap, 8, sType));
            }

            Theater theater = new Theater(tName, tLoc, movieIds, sCount, screens);
            theater = theaterRepository.insert(theater);
            linkedTheaterId = theater.getTheaterId();
            linkedTheaterName = theater.getName();
        }

        Login newUser = new Login(name, cleanEmail, password, userRole, linkedTheaterId, linkedTheaterName);
        loginRepository.insert(newUser);

        response.put("success", true);
        response.put("userId", newUser.getUserId());
        response.put("name", newUser.getName());
        response.put("email", newUser.getEmail());
        response.put("role", newUser.getRole());
        response.put("theaterId", newUser.getTheaterId());
        response.put("theaterName", newUser.getTheaterName());
        return response;
    }

    public Map<String, Object> authenticate(String email, String password) {
        Map<String, Object> response = new HashMap<>();

        if (email == null || password == null) {
            response.put("error", "Email and password are required");
            return response;
        }

        String cleanEmail = email.trim().toLowerCase();
        String cleanPassword = password.trim();

        // 1. Admin login: ayushg1500@gmail.com / 123
        if ("ayushg1500@gmail.com".equalsIgnoreCase(cleanEmail) && "123".equals(cleanPassword)) {
            Optional<Login> adminOpt = loginRepository.findByEmail("ayushg1500@gmail.com");
            Login adminUser;
            if (adminOpt.isPresent()) {
                adminUser = adminOpt.get();
                adminUser.setRole("ADMIN");
                adminUser.setPassword("123");
                loginRepository.save(adminUser);
            } else {
                adminUser = new Login("Ayush (Administrator)", "ayushg1500@gmail.com", "123", "ADMIN");
                adminUser = loginRepository.insert(adminUser);
            }

            response.put("success", true);
            response.put("userId", adminUser.getUserId());
            response.put("name", adminUser.getName());
            response.put("email", adminUser.getEmail());
            response.put("role", "ADMIN");
            response.put("theaterId", null);
            response.put("theaterName", null);
            return response;
        }

        // 2. Theater login: theater@.com (and theater@gmail.com) / 123
        if (("theater@.com".equalsIgnoreCase(cleanEmail) || "theater@gmail.com".equalsIgnoreCase(cleanEmail)) && "123".equals(cleanPassword)) {
            Theater linkedTheater = null;
            List<Theater> theaters = theaterRepository.findAll();
            if (!theaters.isEmpty()) {
                linkedTheater = theaters.get(0);
            } else {
                List<String> movieIds = new ArrayList<>();
                try {
                    List<Movie> allM = movieRepository.findAll();
                    if (allM != null) {
                        for (Movie m : allM) {
                            if (m.getImdbId() != null) movieIds.add(m.getImdbId());
                        }
                    }
                } catch (Exception ignored) {}

                List<ScreenConfig> scList = new ArrayList<>();
                scList.add(new ScreenConfig("Screen 1 (Laser 4K)", 64, 8, "Standard"));
                scList.add(new ScreenConfig("Screen 2 (Dolby Atmos)", 80, 8, "IMAX"));
                scList.add(new ScreenConfig("Screen 3 (VIP Recliner)", 48, 6, "VIP Recliner"));

                Theater t = new Theater("PVR ICON: Gold Class & IMAX", "Downtown Cinema Mall, Floor 4, Mumbai", movieIds, 3, scList);
                linkedTheater = theaterRepository.insert(t);
            }

            Optional<Login> theaterOpt = loginRepository.findByEmail(cleanEmail);
            Login theaterUser;
            if (theaterOpt.isPresent()) {
                theaterUser = theaterOpt.get();
                theaterUser.setRole("THEATER");
                theaterUser.setPassword("123");
                if (theaterUser.getTheaterId() == null && linkedTheater != null) {
                    theaterUser.setTheaterId(linkedTheater.getTheaterId());
                    theaterUser.setTheaterName(linkedTheater.getName());
                }
                loginRepository.save(theaterUser);
            } else {
                theaterUser = new Login(
                    "PVR Cinema Manager",
                    cleanEmail,
                    "123",
                    "THEATER",
                    linkedTheater != null ? linkedTheater.getTheaterId() : "th-pvr-01",
                    linkedTheater != null ? linkedTheater.getName() : "PVR ICON: Gold Class & IMAX"
                );
                theaterUser = loginRepository.insert(theaterUser);
            }

            response.put("success", true);
            response.put("userId", theaterUser.getUserId());
            response.put("name", theaterUser.getName());
            response.put("email", theaterUser.getEmail());
            response.put("role", "THEATER");
            response.put("theaterId", theaterUser.getTheaterId());
            response.put("theaterName", theaterUser.getTheaterName());
            return response;
        }

        // 3. Normal user login: user@.com (and user@gmail.com) / 123
        if (("user@.com".equalsIgnoreCase(cleanEmail) || "user@gmail.com".equalsIgnoreCase(cleanEmail)) && "123".equals(cleanPassword)) {
            Optional<Login> userOpt = loginRepository.findByEmail(cleanEmail);
            Login normalUser;
            if (userOpt.isPresent()) {
                normalUser = userOpt.get();
                normalUser.setRole("USER");
                normalUser.setPassword("123");
                loginRepository.save(normalUser);
            } else {
                normalUser = new Login("Cinema Goer", cleanEmail, "123", "USER");
                normalUser = loginRepository.insert(normalUser);
            }

            response.put("success", true);
            response.put("userId", normalUser.getUserId());
            response.put("name", normalUser.getName());
            response.put("email", normalUser.getEmail());
            response.put("role", "USER");
            response.put("theaterId", null);
            response.put("theaterName", null);
            return response;
        }

        // 4. Regular registered user check
        Optional<Login> userOpt = loginRepository.findByEmailAndPassword(cleanEmail, cleanPassword);
        if (userOpt.isEmpty()) {
            userOpt = loginRepository.findByEmailAndPassword(email.trim(), password);
        }

        if (userOpt.isPresent()) {
            Login user = userOpt.get();
            response.put("success", true);
            response.put("userId", user.getUserId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("theaterId", user.getTheaterId());
            response.put("theaterName", user.getTheaterName());
            return response;
        }

        response.put("error", "Invalid email or password");
        return response;
    }
}
