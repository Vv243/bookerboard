package com.bookerboard.solver.model;

import java.util.List;

public class Star {

    // -------------------------------------------------------------------------
    // Identity
    // -------------------------------------------------------------------------
    private String id;
    private String name;
    private String brand;
    private String scheduleType; // full_time, part_time, special_appearance
    private String status; // active, injured, suspended

    // -------------------------------------------------------------------------
    // Fan score — automated, temporal, high confidence
    // -------------------------------------------------------------------------
    private int fanScoreValue;
    private String fanScoreTrend; // up, down, stable
    private String fanScoreConfidence; // high, medium, low

    // -------------------------------------------------------------------------
    // Draw score — partially manual, lower confidence for manual entries
    // -------------------------------------------------------------------------
    private int drawScoreValue;
    private String drawScoreConfidence;

    // -------------------------------------------------------------------------
    // Backstage score — manual, private, creative director only
    // -------------------------------------------------------------------------
    private int backstageScoreValue;
    private String backstageScoreConfidence;
    private boolean backstageScoreBelowThreshold;

    // -------------------------------------------------------------------------
    // Availability
    // -------------------------------------------------------------------------
    private boolean available;
    private Integer appearancesRemaining; // null for full-time stars

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public Star() {
    }

    // -------------------------------------------------------------------------
    // Business methods — logic that belongs on the model
    // -------------------------------------------------------------------------

    /**
     * Returns true if this star can be considered for a segment.
     * A star is bookable if they are active and available.
     * Used by AC-3 to filter domains before constraint propagation.
     */
    public boolean isBookable() {
        return "active".equals(status) && available;
    }

    /**
     * Returns true if this star has a backstage risk flag.
     * Used by beam search to attach warnings to backup plans.
     */
    public boolean hasBackstageRisk() {
        return backstageScoreBelowThreshold;
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBrand() {
        return brand;
    }

    public String getScheduleType() {
        return scheduleType;
    }

    public String getStatus() {
        return status;
    }

    public int getFanScoreValue() {
        return fanScoreValue;
    }

    public String getFanScoreTrend() {
        return fanScoreTrend;
    }

    public String getFanScoreConfidence() {
        return fanScoreConfidence;
    }

    public int getDrawScoreValue() {
        return drawScoreValue;
    }

    public String getDrawScoreConfidence() {
        return drawScoreConfidence;
    }

    public int getBackstageScoreValue() {
        return backstageScoreValue;
    }

    public String getBackstageScoreConfidence() {
        return backstageScoreConfidence;
    }

    public boolean isBackstageScoreBelowThreshold() {
        return backstageScoreBelowThreshold;
    }

    public boolean isAvailable() {
        return available;
    }

    public Integer getAppearancesRemaining() {
        return appearancesRemaining;
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------
    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public void setScheduleType(String scheduleType) {
        this.scheduleType = scheduleType;
    }

    public void setStatus(String status) {
        if (status == null || !List.of("active", "injured", "suspended").contains(status)) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + status + "'. Must be active, injured, or suspended.");
        }
        this.status = status;
    }

    public void setFanScoreValue(int fanScoreValue) {
        this.fanScoreValue = fanScoreValue;
    }

    public void setFanScoreTrend(String fanScoreTrend) {
        this.fanScoreTrend = fanScoreTrend;
    }

    public void setFanScoreConfidence(String fanScoreConfidence) {
        this.fanScoreConfidence = fanScoreConfidence;
    }

    public void setDrawScoreValue(int drawScoreValue) {
        this.drawScoreValue = drawScoreValue;
    }

    public void setDrawScoreConfidence(String drawScoreConfidence) {
        this.drawScoreConfidence = drawScoreConfidence;
    }

    public void setBackstageScoreValue(int backstageScoreValue) {
        this.backstageScoreValue = backstageScoreValue;
    }

    public void setBackstageScoreConfidence(String backstageScoreConfidence) {
        this.backstageScoreConfidence = backstageScoreConfidence;
    }

    public void setBackstageScoreBelowThreshold(boolean below) {
        this.backstageScoreBelowThreshold = below;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public void setAppearancesRemaining(Integer appearancesRemaining) {
        this.appearancesRemaining = appearancesRemaining;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "Star{" +
                "name ='" + name + "'" +
                ", brand ='" + brand + "'" +
                ", status ='" + status + "'" +
                ", fanScore ='" + fanScoreValue + "'" +
                ", available ='" + available + "'" +
                ", bookable= '" + isBookable() + "'" +
                "}";
    }
}