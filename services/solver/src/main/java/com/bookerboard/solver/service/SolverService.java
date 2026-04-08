package com.bookerboard.solver.service;

import com.bookerboard.solver.model.BackupPlan;
import com.bookerboard.solver.model.Card;
import com.bookerboard.solver.solver.AC3;
import com.bookerboard.solver.solver.BeamSearch;
import com.bookerboard.solver.solver.ConstraintGraph;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SolverService {

    private final AC3 ac3 = new AC3();
    private final BeamSearch beamSearch = new BeamSearch();


     /**
     * Runs the full solver pipeline on a card.
     * Step 1: Build the constraint graph.
     * Step 2: Run AC-3 to prune invalid stars from domains.
     * Step 3: Run beam search to find top-K replacement cards.
     *
     * @param card the card with constraint violations to resolve
     * @return ranked backup plans, empty list if no solution exists
     */
    public List<BackupPlan> solve(Card card) {
        String solverRunId = UUID.randomUUID().toString();

        // Step 1: Build constraint graph
        ConstraintGraph graph = new ConstraintGraph(card);

        // Step 2: Run AC-3
        boolean solutionPossible = ac3.run(card, graph);

        // Step 3: If AC3 can't find a solution, return empty list
        if(!solutionPossible) {
            return new ArrayList<>();
        }

        // Step 4: run beam search and return ranked plans
        return beamSearch.run(card, solverRunId);
    }
}

