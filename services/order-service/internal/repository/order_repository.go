package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/jondmarien/eco-market/services/order-service/internal/models"
)

// OrderRepository handles database operations for orders
type OrderRepository struct {
	db    *sql.DB
	redis *redis.Client
}

// NewOrderRepository creates a new OrderRepository
func NewOrderRepository(db *sql.DB, redis *redis.Client) *OrderRepository {
	return &OrderRepository{
		db:    db,
		redis: redis,
	}
}

// CreateOrder creates a new order in the database
func (r *OrderRepository) CreateOrder(ctx context.Context, order *models.Order) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert order
	query := `
		INSERT INTO orders (
			id, user_id, status, total_amount, currency,
			shipping_street, shipping_city, shipping_state, shipping_postal_code, shipping_country,
			billing_street, billing_city, billing_state, billing_postal_code, billing_country,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err = tx.ExecContext(ctx, query,
		order.ID, order.UserID, order.Status, order.TotalAmount, order.Currency,
		order.ShippingAddress.Street, order.ShippingAddress.City, order.ShippingAddress.State,
		order.ShippingAddress.PostalCode, order.ShippingAddress.Country,
		order.BillingAddress.Street, order.BillingAddress.City, order.BillingAddress.State,
		order.BillingAddress.PostalCode, order.BillingAddress.Country,
		order.CreatedAt, order.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert order: %w", err)
	}

	// Insert order items
	for _, item := range order.Items {
		itemQuery := `
			INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
			VALUES ($1, $2, $3, $4, $5, $6)`

		_, err = tx.ExecContext(ctx, itemQuery,
			item.ID, item.OrderID, item.ProductID, item.Quantity, item.UnitPrice, item.TotalPrice,
		)
		if err != nil {
			return fmt.Errorf("failed to insert order item: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Cache the order in Redis
	r.cacheOrder(ctx, order)

	return nil
}

// GetOrderByID retrieves an order by ID
func (r *OrderRepository) GetOrderByID(ctx context.Context, orderID uuid.UUID) (*models.Order, error) {
	// Try to get from Redis cache first
	if order := r.getOrderFromCache(ctx, orderID); order != nil {
		return order, nil
	}

	// Get from database
	order := &models.Order{}
	query := `
		SELECT id, user_id, status, total_amount, currency,
			   shipping_street, shipping_city, shipping_state, shipping_postal_code, shipping_country,
			   billing_street, billing_city, billing_state, billing_postal_code, billing_country,
			   created_at, updated_at
		FROM orders WHERE id = $1`

	row := r.db.QueryRowContext(ctx, query, orderID)
	err := row.Scan(
		&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency,
		&order.ShippingAddress.Street, &order.ShippingAddress.City, &order.ShippingAddress.State,
		&order.ShippingAddress.PostalCode, &order.ShippingAddress.Country,
		&order.BillingAddress.Street, &order.BillingAddress.City, &order.BillingAddress.State,
		&order.BillingAddress.PostalCode, &order.BillingAddress.Country,
		&order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	// Get order items
	items, err := r.getOrderItems(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}
	order.Items = items

	// Cache the order
	r.cacheOrder(ctx, order)

	return order, nil
}

// GetOrdersByUserID retrieves orders for a specific user
func (r *OrderRepository) GetOrdersByUserID(ctx context.Context, userID uuid.UUID, page, limit int) ([]models.Order, int, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := "SELECT COUNT(*) FROM orders WHERE user_id = $1"
	err := r.db.QueryRowContext(ctx, countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get order count: %w", err)
	}

	// Get orders
	query := `
		SELECT id, user_id, status, total_amount, currency,
			   shipping_street, shipping_city, shipping_state, shipping_postal_code, shipping_country,
			   billing_street, billing_city, billing_state, billing_postal_code, billing_country,
			   created_at, updated_at
		FROM orders WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.Status, &order.TotalAmount, &order.Currency,
			&order.ShippingAddress.Street, &order.ShippingAddress.City, &order.ShippingAddress.State,
			&order.ShippingAddress.PostalCode, &order.ShippingAddress.Country,
			&order.BillingAddress.Street, &order.BillingAddress.City, &order.BillingAddress.State,
			&order.BillingAddress.PostalCode, &order.BillingAddress.Country,
			&order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan order: %w", err)
		}

		// Get order items for each order
		items, err := r.getOrderItems(ctx, order.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get order items: %w", err)
		}
		order.Items = items

		orders = append(orders, order)
	}

	return orders, total, nil
}

// UpdateOrderStatus updates the status of an order
func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status models.OrderStatus) error {
	query := "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	result, err := r.db.ExecContext(ctx, query, status, orderID)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	// Invalidate cache
	r.invalidateOrderCache(ctx, orderID)

	return nil
}

// DeleteOrder deletes an order (only if pending)
func (r *OrderRepository) DeleteOrder(ctx context.Context, orderID uuid.UUID) error {
	query := "DELETE FROM orders WHERE id = $1 AND status = 'pending'"
	result, err := r.db.ExecContext(ctx, query, orderID)
	if err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found or cannot be deleted")
	}

	// Invalidate cache
	r.invalidateOrderCache(ctx, orderID)

	return nil
}

// getOrderItems retrieves items for a specific order
func (r *OrderRepository) getOrderItems(ctx context.Context, orderID uuid.UUID) ([]models.OrderItem, error) {
	query := `
		SELECT id, order_id, product_id, quantity, unit_price, total_price
		FROM order_items WHERE order_id = $1`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to query order items: %w", err)
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.ProductID,
			&item.Quantity, &item.UnitPrice, &item.TotalPrice,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order item: %w", err)
		}
		items = append(items, item)
	}

	return items, nil
}

// cacheOrder stores an order in Redis cache
func (r *OrderRepository) cacheOrder(ctx context.Context, order *models.Order) {
	orderJSON, err := json.Marshal(order)
	if err != nil {
		return // Fail silently for cache operations
	}

	cacheKey := fmt.Sprintf("order:%s", order.ID.String())
	r.redis.Set(ctx, cacheKey, orderJSON, 30*time.Minute)
}

// getOrderFromCache retrieves an order from Redis cache
func (r *OrderRepository) getOrderFromCache(ctx context.Context, orderID uuid.UUID) *models.Order {
	cacheKey := fmt.Sprintf("order:%s", orderID.String())
	orderJSON, err := r.redis.Get(ctx, cacheKey).Result()
	if err != nil {
		return nil // Cache miss or error
	}

	var order models.Order
	if err := json.Unmarshal([]byte(orderJSON), &order); err != nil {
		return nil
	}

	return &order
}

// invalidateOrderCache removes an order from Redis cache
func (r *OrderRepository) invalidateOrderCache(ctx context.Context, orderID uuid.UUID) {
	cacheKey := fmt.Sprintf("order:%s", orderID.String())
	r.redis.Del(ctx, cacheKey)
}

// InitializeDatabase creates the database schema
func (r *OrderRepository) InitializeDatabase(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS orders (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
		currency VARCHAR(3) NOT NULL DEFAULT 'USD',
		shipping_street VARCHAR(255),
		shipping_city VARCHAR(100),
		shipping_state VARCHAR(100),
		shipping_postal_code VARCHAR(20),
		shipping_country VARCHAR(100),
		billing_street VARCHAR(255),
		billing_city VARCHAR(100),
		billing_state VARCHAR(100),
		billing_postal_code VARCHAR(20),
		billing_country VARCHAR(100),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS order_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
		product_id UUID NOT NULL,
		quantity INTEGER NOT NULL CHECK (quantity > 0),
		unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
		total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
	CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
	CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
	CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
	CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
	`

	_, err := r.db.ExecContext(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize database schema: %w", err)
	}

	return nil
}
