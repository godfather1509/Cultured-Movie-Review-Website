package com.fullStack.Movie.Theater;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScreenConfig {
    private String screenName;
    private int capacity;
    private int seatsPerRow;
    private String layoutType;
    private int rows;
    private int columns;
    private String aisleType; // "center", "dual", "single", "custom"
    private String aisles;    // comma separated column indices where aisle gap occurs e.g. "4,12"
    private String disabledSeats; // comma separated seats omitted e.g. "A1,A2,C5"

    public ScreenConfig(String screenName, int capacity, int seatsPerRow, String layoutType) {
        this.screenName = screenName;
        this.capacity = capacity;
        this.seatsPerRow = seatsPerRow;
        this.layoutType = layoutType;
        this.columns = seatsPerRow > 0 ? seatsPerRow : 8;
        this.rows = (capacity > 0 && this.columns > 0) ? (int) Math.ceil((double) capacity / this.columns) : 8;
        this.aisleType = "center";
        this.aisles = "";
        this.disabledSeats = "";
    }
}

