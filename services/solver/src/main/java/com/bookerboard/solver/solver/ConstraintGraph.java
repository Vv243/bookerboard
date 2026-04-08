package com.bookerboard.solver.solver;

import com.bookerboard.solver.model.Card;
import com.bookerboard.solver.model.Segment;
import java.util.List;
import java.util.ArrayList;

public class ConstraintGraph {

    private final List<Arc> arcs;

    // Constructor - builds all arcs from the card
    public ConstraintGraph(Card card) {
        this.arcs = new ArrayList<>();
        buildArcs(card);
    }

    // Builds arcs between every pair of segments
    private void buildArcs(Card card) {
        // for every pair (i, j) where i != j:
        // create an Arc with constraintType "star_uniqueness"
        // add it to this.arcs
        List<Segment> segments = card.getSegments();
        for (int i=0; i < segments.size(); i++) {
            for (int j=0; j < segments.size(); j++) {
                if (i != j) {
                    Arc newArc = new Arc(segments.get(i), segments.get(j), "star_uniqueness");
                    this.arcs.add(newArc);
                }
            }
        }
        
    }

    // Returns all arcs pointing TO the given segment
    public List<Arc> getArcsPointingTo(Segment segment) {
        // filter arcs where arc.getTarget() equals the given segment
        List<Arc> result = new ArrayList<>();
        for (Arc arc : this.arcs) {
            if (arc.getTarget() == segment){
                result.add(arc);
            }
        }
        return result; 

    }

    // Returns all arcs — used to initialize AC-3 worklist
    public List<Arc> getAllArcs() {
        return new ArrayList<>(arcs);
    }

}