package com.bookerboard.solver.model;

import java.util.List;

public class BackupPlan {

    private String id;
    private String solverRunId;
    private int rank;
    private double confidenceScore;
    private List<Segment> modifiedSegments;
    private String reasoning;
    private List<String> warnings;

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public String getId() {
        return id;
    }

    public String getSolverRunId() {
        return solverRunId;
    }

    public int getRank() {
        return rank;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public List<Segment> getModifiedSegments() {
        return modifiedSegments;
    }

    public String getReasoning() {
        return reasoning;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------
    public void setId(String id) {
        this.id = id;
    }

    public void setSolverRunId(String solverRunId) {
        this.solverRunId = solverRunId;
    }

    public void setRank(int rank) {
        if (rank < 1 || rank > 10) {
            throw new IllegalArgumentException(
                    "Invalid rank: " + rank + ". Must be between 1 and 10.");
        }
        this.rank = rank;
    }

    public void setConfidenceScore(double confidenceScore) {
        if (confidenceScore < 0 || confidenceScore > 1) {
            throw new IllegalArgumentException(
                    "Invalid confidenceScore: " + confidenceScore + ". Must be between 0 and 1.");
        }
        this.confidenceScore = confidenceScore;
    }

    public void setModifiedSegments(List<Segment> modifiedSegments) {
        this.modifiedSegments = modifiedSegments;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "BackupPlan{" +
                "id = '" + id + "'" +
                ", solverRunId = '" + solverRunId + "'" +
                ", rank = " + rank + 
                ", confidenceScore = '" + confidenceScore + "'" +
                ", modifiedSegments = '" + modifiedSegments + "'" +
                ", reasoning = '" + reasoning + "'" +
                ", warnings = '" + warnings + "'" +
                "}";
    }
}
