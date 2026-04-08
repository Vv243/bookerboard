package com.bookerboard.solver.controller;

import com.bookerboard.solver.model.BackupPlan;
import com.bookerboard.solver.model.Card;
import com.bookerboard.solver.service.SolverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SolverController{

    @Autowired
    private SolverService solverService;

    /**
     * POST /solve
     * Receives a card as JSON from Go API.
     * Returns ranked backup plans as JSON.
     */
    @PostMapping("/solve")
    public ResponseEntity<List<BackupPlan>> solve(@RequestBody Card card){
        List<BackupPlan> plans = solverService.solve(card);

        if (plans.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204 - no solution found
        }

        return ResponseEntity.ok(plans); // 200 - found backup plans and return
    }
}