package com.bookerboard.solver.solver;

import com.bookerboard.solver.model.Card;
import com.bookerboard.solver.model.Segment;
import com.bookerboard.solver.model.Star;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public class AC3 {
    /**
     * Runs AC-3 arc consistency on the given card.
     * Removes invalid stars from segment domains until no
     * inconsistencies remain or a domain becomes empty.
     *
     * @param card  the card to process
     * @param graph the constraint graph built from the card
     * @return true if a solution may exist, false if any domain is empty
     */
    public boolean run(Card card, ConstraintGraph graph) {

        // Step 1 — initialize the worklist with all arcs
        Queue<Arc> worklist = new LinkedList<>();
        // add all arcs from graph to worklist
        worklist.addAll(graph.getAllArcs());

        // Step 2 — process arcs until worklist is empty
        while (!worklist.isEmpty()) {

            // poll the next arc from the worklist
            Arc arc = worklist.poll();
            // Step 3 — run arc-reduce on this arc
            boolean domainShrank = arcReduce(arc.getSource(), arc.getTarget());

            // Step 4 — if domain shrank, check for failure and re-add neighbors
            if (domainShrank) {

                // if source domain is empty return false
                if (arc.getSource().isDomainEmpty()) {
                    return false;
                }

                // add all arcs pointing TO source back to worklist
                // except the arc coming FROM target (avoid re-checking same arc)
                for (Arc neighbor : graph.getArcsPointingTo(arc.getSource())){
                    if (neighbor.getSource() != arc.getTarget()){
                        worklist.add(neighbor);
                    }
                }
            }
        }

        return true;
    }

    /**
     * Removes stars from source's domain that are incompatible
     * with all stars in target's domain under the star uniqueness constraint.
     *
     * Returns true if any star was removed (domain shrank).
     */
    private boolean arcReduce(Segment source, Segment target) {
        boolean removed = false;
        List<Star> toRemove = new ArrayList<>();

        for (Star star : source.getDomain()) {
            // A star in source is incompatible if the SAME star
            // appears as the only option in target's domain
            boolean compatible = target.getDomain().stream()
                    .anyMatch(targetStar -> !targetStar.getId().equals(star.getId()));

            if (!compatible) {
                toRemove.add(star);
                removed = true;
            }
        }

        source.getDomain().removeAll(toRemove);
        return removed;
    }
}