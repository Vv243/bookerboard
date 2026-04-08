package com.bookerboard.solver.model;

import java.util.List;

public class BroadcastWindow {

    private String eventType; // raw, smackdown, ple, special
    private int contentMinutes; // available content time after ads
    private String constraintType; // soft = warn, hard = block

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public BroadcastWindow() {
    }

    // -------------------------------------------------------------------------
    // Business methods — logic that belongs on the model
    // -------------------------------------------------------------------------

    /**
     * Returns true if exceeding the content budget should block
     * card finalization. False means warn only.
     * Raw = soft (flexible Netflix runtime).
     * SmackDown = hard (cable TV cannot overrun).
     */
    public boolean isHardConstraint() {
        return "hard".equals(constraintType);
    }

    /**
     * Returns true if the given total duration exceeds
     * the content budget for this broadcast window.
     */
    public boolean isOverBudget(int totalDurationMinutes) {
        return totalDurationMinutes > contentMinutes;
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public String getEventType() {
        return eventType;
    }

    public int getContentMinutes() {
        return contentMinutes;
    }

    public String getConstraintType() {
        return constraintType;
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public void setContentMinutes(int contentMinutes) {
        this.contentMinutes = contentMinutes;
    }

    public void setConstraintType(String constraintType) {
        if (constraintType == null || !List.of("soft", "hard").contains(constraintType)) {
            throw new IllegalArgumentException(
                    "Invalid constraint type: '" + constraintType + "'. Must be soft or hard.");
        }
        this.constraintType = constraintType;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "BroadcastWindow{" +
                "eventType ='" + eventType + "'" +
                ", contentMinutes =" + contentMinutes +
                ", constraintType ='" + constraintType + "'" +
                "}";
    }

}
