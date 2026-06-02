// page.tsx
"use client";

import { usePurchaseOrderViewModel } from "./usePurchaseOrderViewModel";
import { useAuth } from "../../context/AuthContext";
import { PurchaseOrderList } from "./components/PurchaseOrderList";
import { PurchaseOrderForm } from "./components/PurchaseOrderForm";

export default function PurchaseOrderPage() {
  const model = usePurchaseOrderViewModel();
  const { hasPermission } = useAuth();

  const canViewPurchaseOrder = hasPermission("view_purchases");
  const canCreatePurchaseOrder = hasPermission("create_purchases");
  const canUpdatePurchaseOrder = hasPermission("edit_purchases");
  const canDeletePurchaseOrder = hasPermission("delete_purchases");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
      case "SENT":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "PARTIALLY_RECEIVED":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "RECEIVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  // --- LIST VIEW ---
  if (model.view === "list") {
    return (
      <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
        {canViewPurchaseOrder && (
          <PurchaseOrderList
            poList={model.poList}
            loading={model.loading}
            searchTerm={model.searchTerm}
            setSearchTerm={model.setSearchTerm}
            handleCreateNew={model.handleCreateNew}
            startEdit={model.startEdit}
            deletePurchaseOrder={model.deletePurchaseOrder}
            canCreatePurchaseOrder={canCreatePurchaseOrder}
            canUpdatePurchaseOrder={canUpdatePurchaseOrder}
            canDeletePurchaseOrder={canDeletePurchaseOrder}
            currentPage={model.currentPage}
            totalPages={model.totalPages}
            pageSize={model.pageSize}
            totalCount={model.totalCount}
            setCurrentPage={model.setCurrentPage}
            setPageSize={model.setPageSize}
            getStatusColor={getStatusColor}
          />
        )}
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <PurchaseOrderForm
      editingUuid={model.editingUuid}
      formData={model.formData}
      setFormData={model.setFormData}
      setVendorSelected={model.setVendorSelected}
      items={model.items}
      totals={model.totals}
      saving={model.saving}
      errors={model.errors}
      suppliers={model.suppliers}
      productSearch={model.productSearch}
      setProductSearch={model.setProductSearch}
      productSuggestions={model.productSuggestions}
      showProductDropdown={model.showProductDropdown}
      setShowProductDropdown={model.setShowProductDropdown}
      searchProducts={model.searchProducts}
      clearProductSearch={model.clearProductSearch}
      addItem={model.addItem}
      removeItem={model.removeItem}
      updateItem={model.updateItem}
      handleSave={model.handleSave}
      setView={model.setView}
      canEditHeader={model.canEditHeader}
      canEditItems={model.canEditItems}
      canReceiveItems={model.canReceiveItems}
      canEditDeliveryDate={model.canEditDeliveryDate}
      canEditNotes={model.canEditNotes}
      canManualStatusChange={model.canManualStatusChange}
      isLocked={model.isLocked}
    />
  );
}
