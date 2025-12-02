import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { codeExecutionService } from '../../services/codeExecution.service';
import { BadRequestError } from '../../utils/errors.util';

/**
 * Submit JavaScript code for execution
 * POST /api/v1/exercises/:exerciseId/submit/javascript
 */
export const submitJavaScript = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;
    const { code, testResults } = req.body;

    if (!code || !testResults) {
      throw new BadRequestError('Code and test results are required');
    }

    const result = await codeExecutionService.executeJavaScript(
      exerciseId,
      userId,
      code,
      testResults
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Java code for execution
 * POST /api/v1/exercises/:exerciseId/submit/java
 */
export const submitJava = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;
    const { code } = req.body;

    if (!code) {
      throw new BadRequestError('Code is required');
    }

    const result = await codeExecutionService.executeJava(
      exerciseId,
      userId,
      code
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Python code for execution
 * POST /api/v1/exercises/:exerciseId/submit/python
 */
export const submitPython = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;
    const { code } = req.body;

    if (!code) {
      throw new BadRequestError('Code is required');
    }

    const result = await codeExecutionService.executePython(
      exerciseId,
      userId,
      code
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get submission history for an exercise
 * GET /api/v1/exercises/:exerciseId/submissions
 */
export const getSubmissionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;

    const submissions = await codeExecutionService.getSubmissionHistory(
      exerciseId,
      userId
    );

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed submission results
 * GET /api/v1/submissions/:submissionId
 */
export const getSubmissionDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { submissionId } = req.params;

    const submission = await codeExecutionService.getSubmissionDetails(
      submissionId,
      userId
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
