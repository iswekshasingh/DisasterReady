
import express from 'express';
import {
    getScenarios,
    getScenarioById
} from '../controllers/scenario.controller.js';

const router = express.Router();

router.get('/', getScenarios);
router.get('/:id', getScenarioById);

export default router;
