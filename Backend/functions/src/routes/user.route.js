import { Router } from "express";
import { transcribe, factCheck, textAnalyzer } from "../controllers/Content.controllers.js";

const router = Router()

router.route("/transcribe").get(transcribe);
router.route("/fact-check").post(factCheck);
router.route("/text-analyzer").post(textAnalyzer);


export default router;