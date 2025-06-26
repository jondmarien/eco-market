package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jondmarien/eco-market/services/order-service/internal/models"
	"github.com/jondmarien/eco-market/services/order-service/internal/repository"
)

// OrderService provides business logic for orders
type OrderService struct {
	repo *repository.OrderRepository
}

// NewOrderService creates a new OrderService
func NewOrderService(repo *repository.OrderRepository) *OrderService {
	return &OrderService{
		repo: repo,
	}
}

// CreateOrder creates a new order with business logic validation
func (s *OrderService) CreateOrder(ctx context.Context, req models.CreateOrderRequest) (*models.Order, error) {
	// Validate request
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("order must contain at least one item")
	}

	// Create order ID and item IDs
	orderID := uuid.New()
	now := time.Now()

	// Calculate total and create order items
	var totalAmount float64
	var orderItems []models.OrderItem

	for _, itemReq := range req.Items {
		// Validate item
		if itemReq.Quantity <= 0 {
			return nil, fmt.Errorf("item quantity must be greater than 0")
		}
		if itemReq.UnitPrice < 0 {
			return nil, fmt.Errorf("item unit price cannot be negative")
		}

		// Calculate total price for this item
		totalPrice := float64(itemReq.Quantity) * itemReq.UnitPrice
		totalAmount += totalPrice

		// Create order item
		orderItem := models.OrderItem{
			ID:         uuid.New(),
			OrderID:    orderID,
			ProductID:  itemReq.ProductID,
			Quantity:   itemReq.Quantity,
			UnitPrice:  itemReq.UnitPrice,
			TotalPrice: totalPrice,
		}
		orderItems = append(orderItems, orderItem)
	}

	// Create order
	order := &models.Order{
		ID:              orderID,
		UserID:          req.UserID,
		Status:          models.OrderStatusPending,
		Items:           orderItems,
		TotalAmount:     totalAmount,
		Currency:        req.Currency,
		ShippingAddress: req.ShippingAddress,
		BillingAddress:  req.BillingAddress,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// Save to database
	if err := s.repo.CreateOrder(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

// GetOrderByID retrieves an order by ID
func (s *OrderService) GetOrderByID(ctx context.Context, orderID uuid.UUID) (*models.Order, error) {
	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}
	return order, nil
}

// GetOrdersByUserID retrieves orders for a specific user with pagination
func (s *OrderService) GetOrdersByUserID(ctx context.Context, userID uuid.UUID, page, limit int) (*models.OrdersResponse, error) {
	// Validate pagination parameters
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	orders, total, err := s.repo.GetOrdersByUserID(ctx, userID, page, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders: %w", err)
	}

	return &models.OrdersResponse{
		Orders: orders,
		Total:  total,
		Page:   page,
		Limit:  limit,
	}, nil
}

// UpdateOrderStatus updates the status of an order with business rules
func (s *OrderService) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, newStatus models.OrderStatus) error {
	// Get current order to check existing status
	currentOrder, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Validate status transition
	if !s.isValidStatusTransition(currentOrder.Status, newStatus) {
		return fmt.Errorf("invalid status transition from %s to %s", currentOrder.Status, newStatus)
	}

	// Update status
	if err := s.repo.UpdateOrderStatus(ctx, orderID, newStatus); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	return nil
}

// CancelOrder cancels an order if it's in a cancellable state
func (s *OrderService) CancelOrder(ctx context.Context, orderID uuid.UUID) error {
	// Get current order
	currentOrder, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Check if order can be cancelled
	if !s.canCancelOrder(currentOrder.Status) {
		return fmt.Errorf("order cannot be cancelled in status: %s", currentOrder.Status)
	}

	// Update status to cancelled
	if err := s.repo.UpdateOrderStatus(ctx, orderID, models.OrderStatusCancelled); err != nil {
		return fmt.Errorf("failed to cancel order: %w", err)
	}

	return nil
}

// GetOrdersByStatus retrieves orders by status (for admin use)
func (s *OrderService) GetOrdersByStatus(ctx context.Context, status models.OrderStatus, page, limit int) (*models.OrdersResponse, error) {
	// This would require a new repository method, for now return empty
	return &models.OrdersResponse{
		Orders: []models.Order{},
		Total:  0,
		Page:   page,
		Limit:  limit,
	}, nil
}

// isValidStatusTransition checks if a status transition is valid
func (s *OrderService) isValidStatusTransition(currentStatus, newStatus models.OrderStatus) bool {
	validTransitions := map[models.OrderStatus][]models.OrderStatus{
		models.OrderStatusPending: {
			models.OrderStatusConfirmed,
			models.OrderStatusCancelled,
		},
		models.OrderStatusConfirmed: {
			models.OrderStatusProcessing,
			models.OrderStatusCancelled,
		},
		models.OrderStatusProcessing: {
			models.OrderStatusShipped,
			models.OrderStatusCancelled,
		},
		models.OrderStatusShipped: {
			models.OrderStatusDelivered,
		},
		models.OrderStatusDelivered: {
			models.OrderStatusRefunded,
		},
		models.OrderStatusCancelled: {}, // Terminal state
		models.OrderStatusRefunded:  {}, // Terminal state
	}

	allowedStatuses, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	for _, allowedStatus := range allowedStatuses {
		if allowedStatus == newStatus {
			return true
		}
	}

	return false
}

// canCancelOrder checks if an order can be cancelled based on its current status
func (s *OrderService) canCancelOrder(status models.OrderStatus) bool {
	cancellableStatuses := []models.OrderStatus{
		models.OrderStatusPending,
		models.OrderStatusConfirmed,
		models.OrderStatusProcessing,
	}

	for _, cancellableStatus := range cancellableStatuses {
		if status == cancellableStatus {
			return true
		}
	}

	return false
}

// GetOrderStats returns order statistics (for admin dashboard)
func (s *OrderService) GetOrderStats(ctx context.Context) (*models.OrderStats, error) {
	// This would require additional repository methods
	// For now, return dummy data
	return &models.OrderStats{
		TotalOrders:     0,
		PendingOrders:   0,
		CompletedOrders: 0,
		CancelledOrders: 0,
		TotalRevenue:    0.0,
	}, nil
}
