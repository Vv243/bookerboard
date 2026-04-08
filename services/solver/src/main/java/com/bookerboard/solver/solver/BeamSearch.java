package com.bookerboard.solver.solver;

import com.bookerboard.solver.model.BackupPlan;
import com.bookerboard.solver.model.Card;
import com.bookerboard.solver.model.Segment;
import com.bookerboard.solver.model.Star;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public class BeamSearch {

    private static final int BEAM_WIDTH = 3;
    private static final double FAN_WEIGHT = 0.6;
    private static final double DRAW_WEIGHT = 0.3;
    private static final double BACKSTAGE_PENALTY = 0.1;

    /**
     * Runs beam search on a card after AC-3 has pruned domains.
     * Generates up to BEAM_WIDTH ranked backup plans.
     *
     * @param card        the card with pruned domains
     * @param solverRunId the solver run id for linking backup plans
     * @return ranked list of backup plans
     */
    public List<BackupPlan> run(Card card, String solverRunId) {

        // Start the beam with the original card
        List<Card> beam = new ArrayList<>();
        beam.add(card);

        // All candidate replacement cards go here
        List<Card> candidates = new ArrayList<>();

        // Three nested loops — candidate → segment → star
        for (Card candidate : beam) {
            for (Segment segment : candidate.getSegments()) {
                if (!segment.isDomainEmpty()) {
                    for (Star star : segment.getDomain()) {

                        // Create a fresh copy of the candidate card
                        Card copy = new Card();
                        copy.setShowId(candidate.getShowId());
                        copy.setBroadcastWindow(candidate.getBroadcastWindow());
                        copy.setAvailableStars(candidate.getAvailableStars());
                        copy.setSegments(new ArrayList<>(candidate.getSegments()));

                        // Find the matching segment on the copy
                        // and assign just this one star to its domain
                        for (Segment copiedSegment : copy.getSegments()) {
                            if (copiedSegment.getId().equals(segment.getId())) {
                                List<Star> singleStar = new ArrayList<>();
                                singleStar.add(star);
                                copiedSegment.setDomain(singleStar);
                            }
                        }

                        candidates.add(copy);
                    }
                }
            }
        }

        // Sort candidates by score — highest first
        candidates.sort(Comparator.comparingDouble(
                (Card c) -> scoreCard(c)).reversed());

        // Keep only the top BEAM_WIDTH candidates
        List<Card> topCandidates = candidates.subList(
                0, Math.min(BEAM_WIDTH, candidates.size()));

        // Convert each top candidate to a BackupPlan
        List<BackupPlan> plans = new ArrayList<>();
        for (int i = 0; i < topCandidates.size(); i++) {
            plans.add(toBackupPlan(topCandidates.get(i), i + 1, solverRunId));
        }

        return plans;
    }

    /**
     * Scores a card based on weighted fan, draw, and backstage signals.
     * Higher is better. Range approximately 0-100.
     */
    private double scoreCard(Card card) {
        // YOUR CODE:
        // 1. Get all stars across all segments
        // 2. Calculate average fan score
        // 3. Calculate average draw score
        // 4. Count stars below backstage threshold
        // 5. Apply weights and return score
        double totalFan = 0;
        double totalDraw = 0;
        int backstageRiskCount = 0;
        int starCount = 0;

        for (Segment segment: card.getSegments()){
            for(Star star: segment.getDomain()){
                totalFan += star.getFanScoreValue();
                totalDraw += star.getDrawScoreValue();
                if(star.hasBackstageRisk()) backstageRiskCount++;
                starCount++;
            }
        }

        if(starCount == 0) return 0.0;
        
        double avgFan = totalFan / starCount;
        double avgDraw = totalDraw / starCount;
        double penalty = backstageRiskCount * 10;

        return (avgFan * FAN_WEIGHT) + (avgDraw * DRAW_WEIGHT) - (penalty * BACKSTAGE_PENALTY);

    }

    /**
     * Converts a scored Card into a BackupPlan for the response.
     */
    private BackupPlan toBackupPlan(Card card, int rank, String solverRunId) {
        double score = scoreCard(card);
        List<String> warnings = new ArrayList<>();

        // Add backstage warnings
        for (Segment segment : card.getSegments()) {
            for (Star star : segment.getDomain()) {
                if (star.hasBackstageRisk()) {
                    warnings.add(star.getName() +
                            " backstage score below threshold (" +
                            star.getBackstageScoreValue() + ")");
                }
            }
        }

        BackupPlan plan = new BackupPlan();
        plan.setId(UUID.randomUUID().toString());
        plan.setSolverRunId(solverRunId);
        plan.setRank(rank);
        plan.setConfidenceScore(score / 100.0);
        plan.setModifiedSegments(card.getSegments());
        plan.setReasoning("Beam search plan " + rank +
                " — score " + String.format("%.1f", score));
        plan.setWarnings(warnings);
        return plan;
    }
}
