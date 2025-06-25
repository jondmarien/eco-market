package models

import (
	"time"
	"github.com/google/uuid"
)

// OrderStatus represents the status of an order
type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusConfirmed  OrderStatus = "confirmed"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusShipped    OrderStatus = "shipped"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
	OrderStatusRefunded   OrderStatus = "refunded"
)

// Order represents an order in the system
type Order struct {
	ID          uuid.UUID     `json:"id" db:"id"`
	UserID      uuid.UUID     `json:"user_id" db:"user_id"`
	Status      OrderStatus   `json:"status" db:"status"`
	Items       []OrderItem   `json:"items"`
	TotalAmount float64       `json:"total_amount" db:"total_amount"`
	Currency    string        `json:"currency" db:"currency"`
	ShippingAddress Address   `json:"shipping_address"`
	BillingAddress  Address   `json:"billing_address"`
	CreatedAt   time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at" db:"updated_at"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID        uuid.UUID `json:"id" db:"id"`
	OrderID   uuid.UUID `json:"order_id" db:"order_id"`
	ProductID uuid.UUID `json:"product_id" db:"product_id"`
	Quantity  int       `json:"quantity" db:"quantity"`
	UnitPrice float64   `json:"unit_price" db:"unit_price"`
	TotalPrice float64  `json:"total_price" db:"total_price"`
}

// Address represents a shipping or billing address
type Address struct {
	Street     string `json:"street" db:"street"`
	City       string `json:"city" db:"city"`
	State      string `json:"state" db:"state"`
	PostalCode string `json:"postal_code" db:"postal_code"`
	Country    string `json:"country" db:"country"`
}

// CreateOrderRequest represents a request to create a new order
type CreateOrderRequest struct {
	UserID          uuid.UUID `json:"user_id" validate:"required"`
	Items           []CreateOrderItemRequest `json:"items" validate:"required,min=1"`
	ShippingAddress Address   `json:"shipping_address" validate:"required"`
	BillingAddress  Address   `json:"billing_address" validate:"required"`
	Currency        string    `json:"currency" validate:"required"`
}

// CreateOrderItemRequest represents an item in a create order request
type CreateOrderItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1"`
	UnitPrice float64   `json:"unit_price" validate:"required,min=0"`
}

// UpdateOrderStatusRequest represents a request to update order status
type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status" validate:"required"`
}

// OrderResponse represents the response format for order operations
type OrderResponse struct {
	Order   *Order `json:"order"`
	Message string `json:"message,omitempty"`
}

// OrdersResponse represents the response format for multiple orders
type OrdersResponse struct {
	Orders []Order `json:"orders"`
	Total  int     `json:"total"`
	Page   int     `json:"page"`
	Limit  int     `json:"limit"`
}
