import {
  PurchaseOrderState,
  getPurchaseOrderState,
} from "./purchaseOrderStates";

export class PurchaseOrderStateContext {
  private state: PurchaseOrderState;
  private currentStatus: string;

  constructor(initialStatus: string) {
    this.currentStatus = initialStatus;
    this.state = getPurchaseOrderState(initialStatus);
  }

  getStatus(): string {
    return this.currentStatus;
  }

  getState(): PurchaseOrderState {
    return this.state;
  }

  // Transition to a new status manually (user or system)
  transitionTo(newStatus: string): boolean {
    if (this.state.canTransitionTo(newStatus)) {
      this.currentStatus = newStatus;
      this.state = getPurchaseOrderState(newStatus);
      return true;
    }
    return false;
  }

  // Automatically update status based on received quantities
  autoUpdateStatus(items: any[]): string {
    const newStatus = this.state.getNextStatusAfterReceiving(items);
    if (
      newStatus !== this.currentStatus &&
      this.state.canTransitionTo(newStatus)
    ) {
      this.currentStatus = newStatus;
      this.state = getPurchaseOrderState(newStatus);
    }
    return this.currentStatus;
  }

  // Convenience methods for UI
  canEditHeader(): boolean {
    return this.state.canEditHeader;
  }
  canEditItems(): boolean {
    return this.state.canEditItems;
  }
  canReceiveItems(): boolean {
    return this.state.canReceiveItems;
  }
  canEditDeliveryDate(): boolean {
    return this.state.canEditDeliveryDate;
  }
  canEditNotes(): boolean {
    return this.state.canEditNotes;
  }
  canManualStatusChange(): boolean {
    return this.state.canManualStatusChange;
  }
  isLocked(): boolean {
    return this.state.isLocked;
  }
}
