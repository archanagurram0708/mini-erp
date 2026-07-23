const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect PostgreSQL Database with SSL handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware for Auth
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// Root Route
app.get('/', (req, res) => {
  res.send('Mini ERP API is running!');
});

// --- AUTHENTICATION: REGISTER ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password with bcrypt before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save with hashed password
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'Admin']
    );

    res.status(201).json({ 
      message: 'Registration successful!', 
      user: newUser.rows[0] 
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

// --- AUTHENTICATION: LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CUSTOMERS ---
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, mobile, email, business_name, gst_number, type, status, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, mobile, email, business_name, gst_number, type, status, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRODUCTS ---
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SALES CHALLAN MODULE ---
app.post('/api/challans', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  const { customer_id, items, status } = req.body;

  try {
    await client.query('BEGIN');

    if (status === 'Confirmed') {
      for (let item of items) {
        const prod = await client.query('SELECT current_stock, name FROM products WHERE id = $1', [item.product_id]);
        if (prod.rows[0].current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${prod.rows[0].name}`);
        }
      }
    }

    const challanNum = 'CH-' + Date.now();
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    const challanRes = await client.query(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [challanNum, customer_id, totalQty, status, req.user.id]
    );

    const challanId = challanRes.rows[0].id;

    for (let item of items) {
      const prodRes = await client.query('SELECT name, unit_price FROM products WHERE id = $1', [item.product_id]);
      const product = prodRes.rows[0];

      await client.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [challanId, item.product_id, product.name, product.unit_price, item.quantity]
      );

      if (status === 'Confirmed') {
        await client.query('UPDATE products SET current_stock = current_stock - $1 WHERE id = $2', [item.quantity, item.product_id]);

        await client.query(
          `INSERT INTO stock_logs (product_id, quantity, type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Challan ${challanNum} Confirmed`, req.user.id]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Challan created successfully', challan: challanRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});