import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { AIProviderRepository } from '../../repositories/aiProvider.repository';
import { AIService } from '../../services/ai/ai.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import { logger } from '../../config/logger.config';

const providerRepo = new AIProviderRepository();
const aiService = new AIService();

/**
 * Get all AI providers for the authenticated user
 */
export const getUserProviders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const activeOnly = req.query.activeOnly === 'true';

    const providers = await providerRepo.getUserProviders(userId, activeOnly);

    // Remove encrypted API keys from response
    const sanitizedProviders = providers.map((p) => ({
      ...p,
      api_key_encrypted: p.api_key_encrypted ? '********' : null,
    }));

    res.json(successResponse(sanitizedProviders));
  } catch (error: any) {
    logger.error('[AIProviderController] getUserProviders failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Get a specific AI provider by ID
 */
export const getProviderById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const provider = await providerRepo.getProviderById(id, userId);

    if (!provider) {
      res.status(404).json(errorResponse('Provider not found'));
      return;
    }

    // Remove encrypted API key from response
    const sanitizedProvider = {
      ...provider,
      api_key_encrypted: provider.api_key_encrypted ? '********' : null,
    };

    res.json(successResponse(sanitizedProvider));
  } catch (error: any) {
    logger.error('[AIProviderController] getProviderById failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Create a new AI provider configuration
 */
export const createProvider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const providerData = req.body;

    const provider = await providerRepo.createProvider(userId, providerData);

    // Remove encrypted API key from response
    const sanitizedProvider = {
      ...provider,
      api_key_encrypted: provider.api_key_encrypted ? '********' : null,
    };

    res.status(201).json(successResponse(sanitizedProvider));
  } catch (error: any) {
    logger.error('[AIProviderController] createProvider failed:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Update an AI provider configuration
 */
export const updateProvider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const provider = await providerRepo.updateProvider(id, userId, updates);

    if (!provider) {
      res.status(404).json(errorResponse('Provider not found'));
      return;
    }

    // Remove encrypted API key from response
    const sanitizedProvider = {
      ...provider,
      api_key_encrypted: provider.api_key_encrypted ? '********' : null,
    };

    res.json(successResponse(sanitizedProvider));
  } catch (error: any) {
    logger.error('[AIProviderController] updateProvider failed:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Delete an AI provider configuration
 */
export const deleteProvider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await providerRepo.deleteProvider(id, userId);

    if (!deleted) {
      res.status(404).json(errorResponse('Provider not found'));
      return;
    }

    res.json(successResponse({ deleted: true }));
  } catch (error: any) {
    logger.error('[AIProviderController] deleteProvider failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Test an AI provider connection
 */
export const testProvider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const isValid = await aiService.testProvider(userId, id);

    res.json(successResponse({ valid: isValid }));
  } catch (error: any) {
    logger.error('[AIProviderController] testProvider failed:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get available models for a provider
 */
export const getProviderModels = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // First get models from database
    const dbModels = await providerRepo.getProviderModels(id);

    // Optionally fetch live models from provider
    const fetchLive = req.query.fetchLive === 'true';
    let liveModels: string[] = [];

    if (fetchLive) {
      try {
        liveModels = await aiService.getProviderModels(userId, id);
      } catch (error) {
        logger.warn('[AIProviderController] Failed to fetch live models', error);
      }
    }

    res.json(
      successResponse({
        configured: dbModels,
        available: liveModels,
      })
    );
  } catch (error: any) {
    logger.error('[AIProviderController] getProviderModels failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Set default model for a provider
 */
export const setDefaultModel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id, modelId } = req.params;

    // Verify user owns the provider
    const provider = await providerRepo.getProviderById(id, userId);
    if (!provider) {
      res.status(404).json(errorResponse('Provider not found'));
      return;
    }

    const success = await providerRepo.setDefaultModel(modelId, id);

    if (!success) {
      res.status(404).json(errorResponse('Model not found'));
      return;
    }

    res.json(successResponse({ success: true }));
  } catch (error: any) {
    logger.error('[AIProviderController] setDefaultModel failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * Send a chat completion request
 */
export const sendChatCompletion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { providerId, ...chatRequest } = req.body;

    const response = await aiService.sendChatCompletion(userId, chatRequest, providerId);

    res.json(successResponse(response));
  } catch (error: any) {
    logger.error('[AIProviderController] sendChatCompletion failed:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * Get user's AI usage statistics
 */
export const getUserUsageStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await aiService.getUserUsageStats(userId, start, end);

    res.json(successResponse(stats));
  } catch (error: any) {
    logger.error('[AIProviderController] getUserUsageStats failed:', error);
    res.status(500).json(errorResponse(error.message));
  }
};
