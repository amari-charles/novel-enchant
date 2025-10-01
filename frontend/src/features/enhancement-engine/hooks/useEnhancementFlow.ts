/**
 * Enhancement Flow State Management Hook
 * Manages the complete enhancement workflow state and operations
 */

import { useReducer, useCallback } from 'react'
import type {
  EnhancementService,
  AutoEnhanceRequest,
  ManualInsertRequest,
  RetryEnhancementRequest,
  Character,
  Anchor,
  Image
} from '../types'

export interface EnhancementFlowState {
  // Current workflow step
  currentStep: 'idle' | 'auto-enhancing' | 'manual-inserting' | 'retrying' | 'accepting'

  // Data state
  anchors: Anchor[]
  candidateCharacters: Character[]
  confirmedCharacters: Character[]
  currentJobId?: string

  // UI state
  selectedAnchorId?: string
  pendingImageId?: string
  error?: string
  isLoading: boolean

  // Progress tracking
  estimatedDuration?: number
  startTime?: number
}

type EnhancementFlowAction =
  | { type: 'START_AUTO_ENHANCE'; payload: { jobId: string; estimatedDuration: number } }
  | { type: 'AUTO_ENHANCE_SUCCESS'; payload: { anchors: Anchor[]; candidateCharacters: Character[] } }
  | { type: 'START_MANUAL_INSERT'; payload: { anchorId: string } }
  | { type: 'MANUAL_INSERT_SUCCESS'; payload: { anchor: Anchor; image: Image; candidateCharacters?: Character[] } }
  | { type: 'START_RETRY'; payload: { anchorId: string } }
  | { type: 'RETRY_SUCCESS'; payload: { anchor: Anchor; image: Image } }
  | { type: 'START_ACCEPT'; payload: { anchorId: string } }
  | { type: 'ACCEPT_SUCCESS'; payload: { anchor: Anchor } }
  | { type: 'CONFIRM_CHARACTER'; payload: { character: Character } }
  | { type: 'SELECT_ANCHOR'; payload: { anchorId?: string } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

const initialState: EnhancementFlowState = {
  currentStep: 'idle',
  anchors: [],
  candidateCharacters: [],
  confirmedCharacters: [],
  isLoading: false
}

function enhancementFlowReducer(
  state: EnhancementFlowState,
  action: EnhancementFlowAction
): EnhancementFlowState {
  switch (action.type) {
    case 'START_AUTO_ENHANCE':
      return {
        ...state,
        currentStep: 'auto-enhancing',
        isLoading: true,
        error: undefined,
        currentJobId: action.payload.jobId,
        estimatedDuration: action.payload.estimatedDuration,
        startTime: Date.now()
      }

    case 'AUTO_ENHANCE_SUCCESS':
      return {
        ...state,
        currentStep: 'idle',
        isLoading: false,
        anchors: action.payload.anchors,
        candidateCharacters: [
          ...state.candidateCharacters,
          ...action.payload.candidateCharacters
        ]
      }

    case 'START_MANUAL_INSERT':
      return {
        ...state,
        currentStep: 'manual-inserting',
        isLoading: true,
        error: undefined,
        selectedAnchorId: action.payload.anchorId
      }

    case 'MANUAL_INSERT_SUCCESS':
      return {
        ...state,
        currentStep: 'idle',
        isLoading: false,
        anchors: state.anchors.map(anchor =>
          anchor.id === action.payload.anchor.id ? action.payload.anchor : anchor
        ).concat(
          state.anchors.find(a => a.id === action.payload.anchor.id) ? [] : [action.payload.anchor]
        ),
        candidateCharacters: action.payload.candidateCharacters ? [
          ...state.candidateCharacters,
          ...action.payload.candidateCharacters
        ] : state.candidateCharacters,
        pendingImageId: action.payload.image.id
      }

    case 'START_RETRY':
      return {
        ...state,
        currentStep: 'retrying',
        isLoading: true,
        error: undefined,
        selectedAnchorId: action.payload.anchorId
      }

    case 'RETRY_SUCCESS':
      return {
        ...state,
        currentStep: 'idle',
        isLoading: false,
        anchors: state.anchors.map(anchor =>
          anchor.id === action.payload.anchor.id ? action.payload.anchor : anchor
        ),
        pendingImageId: action.payload.image.id
      }

    case 'START_ACCEPT':
      return {
        ...state,
        currentStep: 'accepting',
        isLoading: true,
        error: undefined,
        selectedAnchorId: action.payload.anchorId
      }

    case 'ACCEPT_SUCCESS':
      return {
        ...state,
        currentStep: 'idle',
        isLoading: false,
        anchors: state.anchors.map(anchor =>
          anchor.id === action.payload.anchor.id ? action.payload.anchor : anchor
        ),
        pendingImageId: undefined
      }

    case 'CONFIRM_CHARACTER':
      return {
        ...state,
        confirmedCharacters: [
          ...state.confirmedCharacters.filter(c => c.id !== action.payload.character.id),
          action.payload.character
        ],
        candidateCharacters: state.candidateCharacters.filter(
          c => c.id !== action.payload.character.id
        )
      }

    case 'SELECT_ANCHOR':
      return {
        ...state,
        selectedAnchorId: action.payload.anchorId
      }

    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
        currentStep: 'idle'
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export interface UseEnhancementFlowOptions {
  service: EnhancementService
  chapterId: string
  onError?: (error: Error) => void
}

export interface UseEnhancementFlowReturn {
  // State
  state: EnhancementFlowState

  // Actions
  autoEnhance: (request: Omit<AutoEnhanceRequest, 'chapterId'>) => Promise<void>
  manualInsert: (request: Omit<ManualInsertRequest, 'chapterId'>) => Promise<void>
  retryEnhancement: (anchorId: string, options?: { modifyPrompt?: boolean; newPrompt?: string }) => Promise<void>
  acceptEnhancement: (anchorId: string) => Promise<void>
  confirmCharacter: (characterId: string, name?: string, description?: string) => Promise<void>
  selectAnchor: (anchorId?: string) => void
  clearError: () => void
  reset: () => void

  // Computed values
  selectedAnchor?: Anchor
  progressPercent?: number
  timeRemaining?: number
}

export function useEnhancementFlow({
  service,
  chapterId,
  onError
}: UseEnhancementFlowOptions): UseEnhancementFlowReturn {
  const [state, dispatch] = useReducer(enhancementFlowReducer, initialState)

  const handleError = useCallback((error: Error) => {
    dispatch({ type: 'SET_ERROR', payload: { error: error.message } })
    onError?.(error)
  }, [onError])

  const autoEnhance = useCallback(async (request: Omit<AutoEnhanceRequest, 'chapterId'>) => {
    try {
      const fullRequest: AutoEnhanceRequest = {
        ...request,
        chapterId,
        existingCharacters: [...state.confirmedCharacters, ...request.existingCharacters]
      }

      const response = await service.autoEnhance(fullRequest)

      dispatch({
        type: 'START_AUTO_ENHANCE',
        payload: {
          jobId: response.jobId,
          estimatedDuration: response.estimatedDuration
        }
      })

      // In real implementation, would poll for job completion
      // For mock, simulate completion after delay
      setTimeout(() => {
        dispatch({
          type: 'AUTO_ENHANCE_SUCCESS',
          payload: {
            anchors: response.anchors,
            candidateCharacters: response.candidateCharacters
          }
        })
      }, response.estimatedDuration)

    } catch (error) {
      handleError(error as Error)
    }
  }, [service, chapterId, state.confirmedCharacters, handleError])

  const manualInsert = useCallback(async (request: Omit<ManualInsertRequest, 'chapterId'>) => {
    try {
      const fullRequest: ManualInsertRequest = {
        ...request,
        chapterId
      }

      dispatch({ type: 'START_MANUAL_INSERT', payload: { anchorId: `temp-${Date.now()}` } })

      const response = await service.manualInsert(fullRequest)

      dispatch({
        type: 'MANUAL_INSERT_SUCCESS',
        payload: {
          anchor: response.anchor,
          image: response.image,
          candidateCharacters: response.candidateCharacters
        }
      })

    } catch (error) {
      handleError(error as Error)
    }
  }, [service, chapterId, handleError])

  const retryEnhancement = useCallback(async (
    anchorId: string,
    options?: { modifyPrompt?: boolean; newPrompt?: string }
  ) => {
    try {
      const request: RetryEnhancementRequest = {
        anchorId,
        modifyPrompt: options?.modifyPrompt,
        newPrompt: options?.newPrompt
      }

      dispatch({ type: 'START_RETRY', payload: { anchorId } })

      const response = await service.retryEnhancement(request)

      dispatch({
        type: 'RETRY_SUCCESS',
        payload: {
          anchor: response.anchor,
          image: response.image
        }
      })

    } catch (error) {
      handleError(error as Error)
    }
  }, [service, handleError])

  const acceptEnhancement = useCallback(async (anchorId: string) => {
    try {
      dispatch({ type: 'START_ACCEPT', payload: { anchorId } })

      const anchor = await service.acceptEnhancement(anchorId)

      dispatch({
        type: 'ACCEPT_SUCCESS',
        payload: { anchor }
      })

    } catch (error) {
      handleError(error as Error)
    }
  }, [service, handleError])

  const confirmCharacter = useCallback(async (
    characterId: string,
    name?: string,
    description?: string
  ) => {
    try {
      // This would typically call characterService.resolveCharacter
      // For now, just update the local state
      const character = state.candidateCharacters.find(c => c.id === characterId)
      if (character) {
        const confirmedCharacter: Character = {
          ...character,
          status: 'confirmed',
          name: name || character.name,
          shortDesc: description,
          confidence: 1.0,
          updatedAt: new Date().toISOString()
        }

        dispatch({
          type: 'CONFIRM_CHARACTER',
          payload: { character: confirmedCharacter }
        })
      }
    } catch (error) {
      handleError(error as Error)
    }
  }, [state.candidateCharacters, handleError])

  const selectAnchor = useCallback((anchorId?: string) => {
    dispatch({ type: 'SELECT_ANCHOR', payload: { anchorId } })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // Computed values
  const selectedAnchor = state.selectedAnchorId
    ? state.anchors.find(a => a.id === state.selectedAnchorId)
    : undefined

  const progressPercent = state.estimatedDuration && state.startTime
    ? Math.min(100, ((Date.now() - state.startTime) / state.estimatedDuration) * 100)
    : undefined

  const timeRemaining = state.estimatedDuration && state.startTime
    ? Math.max(0, state.estimatedDuration - (Date.now() - state.startTime))
    : undefined

  return {
    state,
    autoEnhance,
    manualInsert,
    retryEnhancement,
    acceptEnhancement,
    confirmCharacter,
    selectAnchor,
    clearError,
    reset,
    selectedAnchor,
    progressPercent,
    timeRemaining
  }
}