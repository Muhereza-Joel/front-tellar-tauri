export interface PurchaseOrderState {
  // UI permissions
  canEditHeader: boolean;
  canEditItems: boolean; // add/remove items, change quantity/price
  canReceiveItems: boolean; // update received_quantity
  canEditDeliveryDate: boolean;
  canEditNotes: boolean;
  canManualStatusChange: boolean;
  isLocked: boolean;

  // Business rules
  canTransitionTo(targetStatus: string): boolean;
  getNextStatusAfterReceiving(items: any[]): string;
}

// Helper to compute status from received quantities
function computeReceivingStatus(items: any[]): string {
  if (items.length === 0) return "DRAFT";
  const allFullyReceived = items.every(
    (i) => (i.received_quantity || 0) >= i.quantity,
  );
  const anyPartial = items.some(
    (i) =>
      (i.received_quantity || 0) > 0 && (i.received_quantity || 0) < i.quantity,
  );
  if (allFullyReceived) return "RECEIVED";
  if (anyPartial) return "PARTIALLY_RECEIVED";
  return "SENT";
}

export class DraftState implements PurchaseOrderState {
  canEditHeader = true;
  canEditItems = true;
  canReceiveItems = false;
  canEditDeliveryDate = true;
  canEditNotes = true;
  canManualStatusChange = true;
  isLocked = false;

  canTransitionTo(targetStatus: string): boolean {
    return ["DRAFT", "SENT", "CANCELLED"].includes(targetStatus);
  }

  getNextStatusAfterReceiving(_items: any[]): string {
    // In DRAFT, receiving is not yet allowed, so status doesn't auto-change
    return "DRAFT";
  }
}

export class SentState implements PurchaseOrderState {
  canEditHeader = false;
  canEditItems = false;
  canReceiveItems = true;
  canEditDeliveryDate = true;
  canEditNotes = true;
  canManualStatusChange = true;
  isLocked = false;

  canTransitionTo(targetStatus: string): boolean {
    return ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"].includes(
      targetStatus,
    );
  }

  getNextStatusAfterReceiving(items: any[]): string {
    return computeReceivingStatus(items);
  }
}

export class PartiallyReceivedState implements PurchaseOrderState {
  canEditHeader = false;
  canEditItems = false;
  canReceiveItems = true;
  canEditDeliveryDate = true;
  canEditNotes = true;
  canManualStatusChange = false;
  isLocked = false;

  canTransitionTo(targetStatus: string): boolean {
    return ["RECEIVED", "CANCELLED"].includes(targetStatus);
  }

  getNextStatusAfterReceiving(items: any[]): string {
    return computeReceivingStatus(items);
  }
}

export class ReceivedState implements PurchaseOrderState {
  canEditHeader = false;
  canEditItems = false;
  canReceiveItems = false;
  canEditDeliveryDate = false;
  canEditNotes = false;
  canManualStatusChange = false;
  isLocked = true;

  canTransitionTo(_targetStatus: string): boolean {
    return false;
  }

  getNextStatusAfterReceiving(_items: any[]): string {
    return "RECEIVED";
  }
}

export class CancelledState implements PurchaseOrderState {
  canEditHeader = false;
  canEditItems = false;
  canReceiveItems = false;
  canEditDeliveryDate = false;
  canEditNotes = false;
  canManualStatusChange = false;
  isLocked = true;

  canTransitionTo(_targetStatus: string): boolean {
    return false;
  }

  getNextStatusAfterReceiving(_items: any[]): string {
    return "CANCELLED";
  }
}

export function getPurchaseOrderState(status: string): PurchaseOrderState {
  switch (status) {
    case "DRAFT":
      return new DraftState();
    case "SENT":
      return new SentState();
    case "PARTIALLY_RECEIVED":
      return new PartiallyReceivedState();
    case "RECEIVED":
      return new ReceivedState();
    case "CANCELLED":
      return new CancelledState();
    default:
      return new DraftState();
  }
}
