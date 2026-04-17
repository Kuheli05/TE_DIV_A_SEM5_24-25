import { Router } from "express";
import { generateMotivationalThought } from "../controller/thoughtController.js";

const router = Router()

router.get("/generate",generateMotivationalThought)

export default router