package com.fullStack.Movie.Theater;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.util.List;
import java.util.ArrayList;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "theaters")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Theater {
    @Id
    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    private String name;
    private String location;
    private List<String> movieIds = new ArrayList<>();
    private Integer screenCount = 2;
    private List<ScreenConfig> screens = new ArrayList<>();

    public String getTheaterId() {
        return id != null ? id.toHexString() : null;
    }

    public Theater(String name, String location, List<String> movieIds) {
        this.name = name;
        this.location = location;
        this.movieIds = movieIds != null ? movieIds : new ArrayList<>();
        this.screenCount = 2;
        this.screens = defaultScreens();
    }

    public Theater(String name, String location, List<String> movieIds, Integer screenCount, List<ScreenConfig> screens) {
        this.name = name;
        this.location = location;
        this.movieIds = movieIds != null ? movieIds : new ArrayList<>();
        this.screenCount = screenCount != null ? screenCount : 2;
        this.screens = (screens != null && !screens.isEmpty()) ? screens : defaultScreens();
    }

    private List<ScreenConfig> defaultScreens() {
        List<ScreenConfig> list = new ArrayList<>();
        list.add(new ScreenConfig("Screen 1 (Laser 4K)", 64, 8, "Standard"));
        list.add(new ScreenConfig("Screen 2 (Dolby Atmos)", 80, 8, "IMAX"));
        return list;
    }
}
