package com.bookerboard.solver.model;

import java.util.List;

public class Segment {

    private String id;
    private String segmentType;
    private int segmentOrder;
    private int durationMinutes;
    private String status;
    private String narrativeThreadId;
    private String contendershipReason;
    private List<Star> domain;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public Segment() {
    }

    // -------------------------------------------------------------------------
    // Business methods — logic that belongs on the model
    // -------------------------------------------------------------------------

    /**
     * Should check both null AND empty list:
     */
    public boolean isDomainEmpty() {
        return domain == null || domain.isEmpty();
    }

    /**
     * Returns true if this segment is a championship match.
     * Championship matches require a contendership reason —
     * AC-3 flags this segment as invalid if contendershipReason is null.
     */
    public boolean isChampionshipMatch() {
        return "championship_match".equals(segmentType);
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public String getId() {
        return id;
    }

    public String getSegmentType() {
        return segmentType;
    }

    public int getSegmentOrder() {
        return segmentOrder;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getStatus() {
        return status;
    }

    public String getNarrativeThreadId() {
        return narrativeThreadId;
    }

    public String getContendershipReason() {
        return contendershipReason;
    }

    public List<Star> getDomain() {
        return domain;
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------
    public void setId(String id) {
        this.id = id;
    }

    public void setSegmentType(String segmentType) {
        this.segmentType = segmentType;
    }

    public void setSegmentOrder(int segmentOrder) {
        this.segmentOrder = segmentOrder;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setStatus(String status) {
        if (status == null || !List.of("valid", "warning", "error").contains(status)) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + status + "'. Must be 'valid', 'warning' or 'error'.");
        }
        this.status = status;
    }

    public void setNarrativeThreadId(String narrativeThreadId) {
        this.narrativeThreadId = narrativeThreadId;
    }

    public void setContendershipReason(String contendershipReason) {
        this.contendershipReason = contendershipReason;
    }

    public void setDomain(List<Star> domain) {
        this.domain = domain;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "Segment{" +
                "id = '" + id + "'" +
                ", segmentType = '" + segmentType + "'" +
                ", segmentOrder = " + segmentOrder +
                ", durationMinutes = " + durationMinutes +
                ", status = '" + status + "'" +
                ", narrativeThreadId = '" + narrativeThreadId + "'" +
                ", contendershipReason = '" + contendershipReason + "'" +
                ", domain = '" + domain + "'" +
                "}";
    }
}
