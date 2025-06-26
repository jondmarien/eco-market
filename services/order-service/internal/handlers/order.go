package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/google/uuid"
	"github.com/jondmarien/eco-market/services/order-service/internal/models"
	"github.com/jondmarien/eco-market/services/order-service/internal/service"
)

// OrderHandler manages orders
type OrderHandler struct {
	service *service.OrderService
}

// NewOrderHandler creates a new OrderHandler
func NewOrderHandler(service *service.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

// CreateOrder handles order creation
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Create order using service
	order, err := h.service.CreateOrder(r.Context(), req)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Respond with created order
	res := models.OrderResponse{
		Order:   order,
		Message: "Order created successfully",
	}
	h.writeJSON(w, res, http.StatusCreated)
}

// GetOrders retrieves orders for a user
func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		h.writeError(w, "user_id parameter is required", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		h.writeError(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}

	// Get orders using service
	ordersResponse, err := h.service.GetOrdersByUserID(r.Context(), userID, page, limit)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, ordersResponse, http.StatusOK)
}

// GetOrder retrieves a single order
func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	orderID, err := uuid.Parse(params["id"])
	if err != nil {
		h.writeError(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	// Get order using service
	order, err := h.service.GetOrderByID(r.Context(), orderID)
	if err != nil {
		if err.Error() == "order not found" {
			h.writeError(w, "Order not found", http.StatusNotFound)
		} else {
			h.writeError(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	res := models.OrderResponse{Order: order}
	h.writeJSON(w, res, http.StatusOK)
}

// UpdateOrder updates an order (placeholder for future functionality)
func (h *OrderHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	orderID, err := uuid.Parse(params["id"])
	if err != nil {
		h.writeError(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	// For now, just return method not allowed
	// In future, implement order updates like changing address, etc.
	_ = orderID
	h.writeError(w, "Order updates not yet implemented", http.StatusMethodNotAllowed)
}

// UpdateOrderStatus updates the status of an order
func (h *OrderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	params := mux.Vars(r)
	orderID, err := uuid.Parse(params["id"])
	if err != nil {
		h.writeError(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	// Update order status using service
	err = h.service.UpdateOrderStatus(r.Context(), orderID, req.Status)
	if err != nil {
		if err.Error() == "order not found" {
			h.writeError(w, "Order not found", http.StatusNotFound)
		} else {
			h.writeError(w, err.Error(), http.StatusBadRequest)
		}
		return
	}

	res := map[string]string{"message": "Order status updated successfully"}
	h.writeJSON(w, res, http.StatusOK)
}

// CancelOrder cancels an order
func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	orderID, err := uuid.Parse(params["id"])
	if err != nil {
		h.writeError(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	// Cancel order using service
	err = h.service.CancelOrder(r.Context(), orderID)
	if err != nil {
		if err.Error() == "order not found" {
			h.writeError(w, "Order not found", http.StatusNotFound)
		} else {
			h.writeError(w, err.Error(), http.StatusBadRequest)
		}
		return
	}

	res := map[string]string{"message": "Order cancelled successfully"}
	h.writeJSON(w, res, http.StatusOK)
}

// GetOrderStats returns order statistics (admin endpoint)
func (h *OrderHandler) GetOrderStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetOrderStats(r.Context())
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, stats, http.StatusOK)
}

// Helper methods
func (h *OrderHandler) writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (h *OrderHandler) writeError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	errorResponse := map[string]string{"error": message}
	json.NewEncoder(w).Encode(errorResponse)
}
