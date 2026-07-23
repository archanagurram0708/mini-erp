import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User details from localStorage
  const userName = localStorage.getItem('name') || 'User';
  const userRole = localStorage.getItem('role') || 'Admin';

  // --- FORM STATES ---
  // New Customer Form State
  const [showCustForm, setShowCustForm] = useState(false);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custBusiness, setCustBusiness] = useState('');
  const [custType, setCustType] = useState('B2B');

  // New Product Form State (Admin/Warehouse)
  const [showProdForm, setShowProdForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');

  // Sales Challan Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [challanStatus, setChallanStatus] = useState('Draft');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const [custRes, prodRes] = await Promise.all([
        API.get('/customers'),
        API.get('/products')
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  // 1. Add New Customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await API.post('/customers', {
        name: custName,
        mobile: custMobile,
        business_name: custBusiness,
        type: custType,
        status: 'Active'
      });
      setSuccessMsg('Customer added successfully!');
      setCustName(''); setCustMobile(''); setCustBusiness('');
      setShowCustForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer');
    }
  };

  // 2. Add New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await API.post('/products', {
        name: prodName,
        sku: prodSku,
        unit_price: parseFloat(prodPrice),
        current_stock: parseInt(prodStock)
      });
      setSuccessMsg('Product added successfully!');
      setProdName(''); setProdSku(''); setProdPrice(''); setProdStock('');
      setShowProdForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product');
    }
  };

  // 3. Sales Challan Form Handlers
  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleChallanSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    const formattedItems = items.map(item => ({
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity)
    }));

    try {
      const res = await API.post('/challans', {
        customer_id: parseInt(selectedCustomer),
        items: formattedItems,
        status: challanStatus
      });

      setSuccessMsg(res.data.message || 'Challan created successfully!');
      setSelectedCustomer('');
      setItems([{ product_id: '', quantity: 1 }]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create challan');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h2>Mini ERP System</h2>
        <div>
          <span style={{ marginRight: '15px' }}>
            Logged in as: <strong>{userName} ({userRole})</strong>
          </span>
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Navigation Tabs with Role-Based Access */}
      <nav style={styles.nav}>
        {(userRole === 'Admin' || userRole === 'Sales' || userRole === 'Accounts') && (
          <button 
            style={activeTab === 'customers' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('customers')}
          >
            👥 Customers
          </button>
        )}

        {(userRole === 'Admin' || userRole === 'Warehouse' || userRole === 'Accounts') && (
          <button 
            style={activeTab === 'products' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('products')}
          >
            📦 Products & Stock
          </button>
        )}

        {(userRole === 'Admin' || userRole === 'Sales') && (
          <button 
            style={activeTab === 'challans' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('challans')}
          >
            📄 Create Sales Challan
          </button>
        )}
      </nav>

      {/* Content Area */}
      <div style={styles.content}>
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        {successMsg && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMsg}</p>}

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Customer Directory</h3>
                  {(userRole === 'Admin' || userRole === 'Sales') && (
                    <button style={styles.primaryBtn} onClick={() => setShowCustForm(!showCustForm)}>
                      {showCustForm ? 'Close Form' : '+ Add Customer'}
                    </button>
                  )}
                </div>

                {/* Add Customer Form */}
                {showCustForm && (
                  <form onSubmit={handleAddCustomer} style={styles.formCardInline}>
                    <h4>Add New Customer</h4>
                    <input type="text" placeholder="Full Name" value={custName} onChange={(e) => setCustName(e.target.value)} required style={styles.inputInline} />
                    <input type="text" placeholder="Mobile" value={custMobile} onChange={(e) => setCustMobile(e.target.value)} required style={styles.inputInline} />
                    <input type="text" placeholder="Business Name" value={custBusiness} onChange={(e) => setCustBusiness(e.target.value)} style={styles.inputInline} />
                    <select value={custType} onChange={(e) => setCustType(e.target.value)} style={styles.inputInline}>
                      <option value="B2B">B2B</option>
                      <option value="B2C">B2C</option>
                    </select>
                    <button type="submit" style={styles.successBtn}>Save Customer</button>
                  </form>
                )}

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Mobile</th>
                      <th style={styles.th}>Business Name</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr><td colSpan="6" style={styles.td}>No customers found</td></tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id}>
                          <td style={styles.td}>{c.id}</td>
                          <td style={styles.td}>{c.name}</td>
                          <td style={styles.td}>{c.mobile || 'N/A'}</td>
                          <td style={styles.td}>{c.business_name || 'N/A'}</td>
                          <td style={styles.td}>{c.type || 'B2C'}</td>
                          <td style={styles.td}>{c.status || 'Active'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Inventory & Products</h3>
                  {(userRole === 'Admin' || userRole === 'Warehouse') && (
                    <button style={styles.primaryBtn} onClick={() => setShowProdForm(!showProdForm)}>
                      {showProdForm ? 'Close Form' : '+ Add Product'}
                    </button>
                  )}
                </div>

                {/* Add Product Form */}
                {showProdForm && (
                  <form onSubmit={handleAddProduct} style={styles.formCardInline}>
                    <h4>Add New Product</h4>
                    <input type="text" placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} required style={styles.inputInline} />
                    <input type="text" placeholder="SKU" value={prodSku} onChange={(e) => setProdSku(e.target.value)} style={styles.inputInline} />
                    <input type="number" step="0.01" placeholder="Unit Price (₹)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required style={styles.inputInline} />
                    <input type="number" placeholder="Initial Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} required style={styles.inputInline} />
                    <button type="submit" style={styles.successBtn}>Save Product</button>
                  </form>
                )}

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Product Name</th>
                      <th style={styles.th}>SKU</th>
                      <th style={styles.th}>Unit Price</th>
                      <th style={styles.th}>Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan="5" style={styles.td}>No products found</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id}>
                          <td style={styles.td}>{p.id}</td>
                          <td style={styles.td}>{p.name}</td>
                          <td style={styles.td}>{p.sku || 'N/A'}</td>
                          <td style={styles.td}>₹{p.unit_price}</td>
                          <td style={{ ...styles.td, fontWeight: 'bold', color: p.current_stock < 5 ? 'red' : 'green' }}>
                            {p.current_stock}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* CREATE SALES CHALLAN TAB */}
            {activeTab === 'challans' && (
              <div style={styles.formCard}>
                <h3>Create New Delivery Challan</h3>
                <form onSubmit={handleChallanSubmit}>
                  <div style={styles.formGroup}>
                    <label>Select Customer: </label>
                    <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} required style={styles.input}>
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.business_name || 'Individual'})</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label>Status: </label>
                    <select value={challanStatus} onChange={(e) => setChallanStatus(e.target.value)} style={styles.input}>
                      <option value="Draft">Draft (No stock deduction)</option>
                      <option value="Confirmed">Confirmed (Deducts stock automatically)</option>
                    </select>
                  </div>

                  <h4>Product Items</h4>
                  {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <select value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required style={styles.input}>
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock}, ₹{p.unit_price})</option>
                        ))}
                      </select>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} placeholder="Qty" required style={{ ...styles.input, width: '100px' }} />
                    </div>
                  ))}

                  <button type="button" onClick={handleAddItem} style={styles.secondaryBtn}>+ Add Another Product</button>
                  <br /><br />
                  <button type="submit" style={styles.successBtn}>Submit Challan</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#007bff', color: '#fff', padding: '15px 30px' },
  logoutBtn: { backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
  nav: { display: 'flex', backgroundColor: '#e9ecef', padding: '10px 30px', borderBottom: '1px solid #ccc' },
  tab: { padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px' },
  activeTab: { padding: '10px 20px', border: 'none', borderBottom: '3px solid #007bff', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px' },
  content: { padding: '30px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', backgroundColor: '#fff' },
  th: { backgroundColor: '#f1f1f1', padding: '12px', border: '1px solid #ddd', textAlign: 'left' },
  td: { padding: '12px', border: '1px solid #ddd' },
  formCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '600px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  formCardInline: { backgroundColor: '#fff', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #ddd', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  formGroup: { marginBottom: '15px' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  inputInline: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '150px' },
  primaryBtn: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
  successBtn: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }
};

export default Dashboard;