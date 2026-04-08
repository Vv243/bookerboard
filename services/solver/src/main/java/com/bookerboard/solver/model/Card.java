package com.bookerboard.solver.model;

import java.util.List;

public class Card {
    private String showId;
    private BroadcastWindow broadcastWindow;
    private List<Segment> segments;
    private List<Star> availableStars;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public Card() {
    }

    // -------------------------------------------------------------------------
    // Business methods — logic that belongs on the model
    // -------------------------------------------------------------------------
    public int getTotalDurationMinutes() {
        if (segments == null)
            return 0;
        int total = 0;
        for (Segment segment : segments) {
            total += segment.getDurationMinutes();
        }
        return total;
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public String getShowId() {
        return showId;
    }

    public BroadcastWindow getBroadcastWindow() {
        return broadcastWindow;
    }

    public List<Segment> getSegments() {
        return segments;
    }

    public List<Star> getAvailableStars() {
        return availableStars;
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------
    public void setShowId(String showId) {
        this.showId = showId;
    }

    public void setBroadcastWindow(BroadcastWindow broadcastWindow) {
        this.broadcastWindow = broadcastWindow;
    }

    public void setSegments(List<Segment> segments) {
        this.segments = segments;
    }

    public void setAvailableStars(List<Star> availableStars) {
        this.availableStars = availableStars;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "Card{" +
                "showId = '" + showId + "'" +
                ", broadcastWindow = '" + broadcastWindow + "'" +
                ", segments = '" + segments + "'" +
                ", availableStars = '" + availableStars + "'" +
                "}";
    }
}
