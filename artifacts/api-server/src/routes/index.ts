import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import dashboardRouter from "./dashboard";
import leaderboardRouter from "./leaderboard";
import feedRouter from "./feed";
import gamificationRouter from "./gamification";
import geoRouter from "./geo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(dashboardRouter);
router.use(leaderboardRouter);
router.use(feedRouter);
router.use(gamificationRouter);
router.use(geoRouter);

export default router;
