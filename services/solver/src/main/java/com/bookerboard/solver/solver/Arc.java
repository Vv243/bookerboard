package com.bookerboard.solver.solver;

import com.bookerboard.solver.model.Segment;

public class Arc {

    private final Segment source; // the segment whose domains we're checking
    private final Segment target; // the segment it has a constraint with
    private final String constraintType; // what connects them

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public Arc(Segment source, Segment target, String constraintType) {
        this.source = source;
        this.target = target;
        this.constraintType = constraintType;
    }

    // -------------------------------------------------------------------------
    // Getters — no setters, Arc is immutable once created
    // -------------------------------------------------------------------------
    public Segment getSource() {
        return source;
    }

    public Segment getTarget() {
        return target;
    }

    public String getConstraintType() {
        return constraintType;
    }

    // -------------------------------------------------------------------------
    // toString — for debugging
    // -------------------------------------------------------------------------
    @Override
    public String toString() {
        return "Arc{" +
                "source=" + source.getId() +
                ", target=" + target.getId() +
                ", constraintType='" + constraintType + "'" +
                "}";
    }

}