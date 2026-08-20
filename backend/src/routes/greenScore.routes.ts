import { Request, Response, Router } from "express";
import { greenScoreService } from "../greenScore/greenScoreService";

const router = Router();

// POST /api/green-score - Calculate Green Score for a workload
router.post("/", (req: Request, res: Response) => {
  try {
    const input = req.body;
    const result = greenScoreService.calculateScore(input);
    const statusCode = result.status === "CALCULATED" ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({
      status: "INVALID_INPUT",
      score: null,
      rating: "N/A",
      error: (error as Error).message
    });
  }
});

// POST /api/green-score/compare - Compare before vs after Green Scores
router.post("/compare", (req: Request, res: Response) => {
  try {
    const { before, after } = req.body;
    const result = greenScoreService.compareScores(before, after);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      status: "INSUFFICIENT_DATA",
      error: (error as Error).message
    });
  }
});

export default router;
