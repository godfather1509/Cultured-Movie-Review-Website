package com.fullStack.Movie.movie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// @SpringBootApplication
@RestController
public class About {

    @GetMapping("/about")
    public String apiAbout(){
        return "Hello World";
    }
    
}
