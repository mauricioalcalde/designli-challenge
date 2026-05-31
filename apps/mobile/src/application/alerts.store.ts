import type { AlertDirection, AlertResponse, CreateAlertDTO } from '@designli-challenge/shared';
import { create } from 'zustand';
import type { AlertsRepository } from '../domain/alerts.repository.port';
import { createIdempotencyKey } from '../data/idempotency-key';
import { AlertsCreateError, AlertsDeleteError, AlertsLoadError } from '../domain/alerts.errors';

export interface CreateAlertInput {
  symbol: string;
  threshold: string;
  direction: AlertDirection;
}

export interface AlertsState {
  items: AlertResponse[];
  isLoading: boolean;
  isSubmitting: boolean;
  deletingIds: number[];
  error: string | null;
  submitError: string | null;
  deleteErrors: Record<number, string>;
  load: () => Promise<void>;
  create: (input: CreateAlertInput) => Promise<boolean>;
  remove: (id: number) => Promise<void>;
}

/**
 * Zustand alerts store factory.
 * Keeps list/delete transitions testable outside React.
 */
export function createAlertsStore(alertsRepo: AlertsRepository) {
  const omitDeleteError = (deleteErrors: Record<number, string>, id: number) => {
    const nextDeleteErrors = { ...deleteErrors };
    delete nextDeleteErrors[id];
    return nextDeleteErrors;
  };

  const upsertAlert = (items: AlertResponse[], nextAlert: AlertResponse) => {
    const existingIndex = items.findIndex((item) => item.id === nextAlert.id);

    if (existingIndex === -1) {
      return [nextAlert, ...items];
    }

    return items.map((item) => (item.id === nextAlert.id ? nextAlert : item));
  };

  const toCreateAlertDTO = (input: CreateAlertInput): CreateAlertDTO => ({
    symbol: input.symbol.trim().toUpperCase(),
    threshold: Number(input.threshold),
    direction: input.direction,
  });

  return create<AlertsState>()((set, get) => ({
    items: [],
    isLoading: false,
    isSubmitting: false,
    deletingIds: [],
    error: null,
    submitError: null,
    deleteErrors: {},

    load: async () => {
      set({ isLoading: true, error: null });

      try {
        const items = await alertsRepo.list();
        set({ items, isLoading: false, error: null });
      } catch (error) {
        const loadError = AlertsLoadError.fromUnknown(error);
        set({ items: [], isLoading: false, error: loadError.message });
      }
    },

    create: async (input: CreateAlertInput) => {
      if (get().isSubmitting) {
        return false;
      }

      set({ isSubmitting: true, submitError: null });

      try {
        const createdAlert = await alertsRepo.create(toCreateAlertDTO(input), createIdempotencyKey());

        set((state) => ({
          items: upsertAlert(state.items, createdAlert),
          isSubmitting: false,
          submitError: null,
        }));

        return true;
      } catch (error) {
        const createError = AlertsCreateError.fromUnknown(error);

        set({
          isSubmitting: false,
          submitError: createError.message,
        });

        return false;
      }
    },

    remove: async (id: number) => {
      if (get().deletingIds.includes(id)) {
        return;
      }

      set((state) => ({
        deletingIds: [...state.deletingIds, id],
        deleteErrors: omitDeleteError(state.deleteErrors, id),
      }));

      try {
        await alertsRepo.delete(id);
        set((state) => {
          return {
            items: state.items.filter((item) => item.id !== id),
            deletingIds: state.deletingIds.filter((value) => value !== id),
            deleteErrors: omitDeleteError(state.deleteErrors, id),
          };
        });
      } catch (error) {
        const deleteError = AlertsDeleteError.fromUnknown(error);

        set((state) => ({
          deletingIds: state.deletingIds.filter((value) => value !== id),
          deleteErrors: {
            ...state.deleteErrors,
            [id]: deleteError.message,
          },
        }));
      }
    },
  }));
}
