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
}

