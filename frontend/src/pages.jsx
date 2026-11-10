import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';

function AuthForm({ mode }) {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '', confirm: '', organizationName: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (mode === 'signup' && f.password !== f.confirm) return setErr('Passwords do not match');
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: f });
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={submit} className="card">
        <h2>{mode === 'signup' ? 'Create your account' : 'Log in'}</h2>
        {mode === 'signup' && (
          <input placeholder="Organization name" value={f.organizationName}
                 onChange={set('organizationName')} required />
        )}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (min 6 characters)" value={f.password}
               onChange={set('password')} required />
        {mode === 'signup' && (
          <input type="password" placeholder="Confirm password" value={f.confirm}
                 onChange={set('confirm')} required />
        )}
        {err && <p className="error">{err}</p>}
        <button type="submit">{mode === 'signup' ? 'Sign up' : 'Log in'}</button>
        <p>
          {mode === 'signup'
            ? <>Have an account? <Link to="/login">Log in</Link></>
            : <>New here? <Link to="/signup">Sign up</Link></>}
        </p>
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Signup = () => <AuthForm mode="signup" />;

export function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api('/dashboard').then(setD).catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="error">{err}</p>;
  if (!d) return <p>Loading...</p>;
  return (
    <>
      <h2>Dashboard</h2>
      <div className="cards">
        <div className="card"><small>Total products</small><h1>{d.totalProducts}</h1></div>
        <div className="card"><small>Total quantity on hand</small><h1>{d.totalQuantity}</h1></div>
      </div>
      <h3>Low stock items</h3>
      {d.lowStock.length === 0 ? (
        <p>No low stock items.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Quantity on hand</th><th>Low stock threshold</th></tr>
          </thead>
          <tbody>
            {d.lowStock.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td>{p.quantity}</td><td>{p.threshold}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export function Products() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const load = () =>
    api('/products?search=' + encodeURIComponent(q)).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [q]);

  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api('/products/' + p.id, { method: 'DELETE' });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <>
      <div className="row">
        <h2>Products</h2>
        <Link className="btn" to="/products/new">Add Product</Link>
      </div>
      <input placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p className="error">{err}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>SKU</th><th>Quantity</th><th>Low stock</th><th>Selling price</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.quantity}</td>
              <td>{p.is_low ? <span className="badge">Low</span> : 'OK'}</td>
              <td>{p.selling_price ?? '-'}</td>
              <td>
                <Link to={'/products/' + p.id}>Edit</Link>{' '}
                <button onClick={() => del(p)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="6">No products yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

export function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: '', sku: '', description: '', quantity: 0,
    cost_price: '', selling_price: '', low_stock_threshold: '',
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!id) return;
    api('/products/' + id)
      .then((p) => setF({
        name: p.name, sku: p.sku, description: p.description || '', quantity: p.quantity,
        cost_price: p.cost_price ?? '', selling_price: p.selling_price ?? '',
        low_stock_threshold: p.low_stock_threshold ?? '',
      }))
      .catch((e) => setErr(e.message));
  }, [id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', body: f });
      nav('/products');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <form onSubmit={submit} className="card form">
      <h2>{id ? 'Edit product' : 'Add product'}</h2>
      <label>Name *<input value={f.name} onChange={set('name')} required /></label>
      <label>SKU *<input value={f.sku} onChange={set('sku')} required /></label>
      <label>Description<input value={f.description} onChange={set('description')} /></label>
      <label>Quantity on hand *<input type="number" min="0" value={f.quantity} onChange={set('quantity')} required /></label>
      <label>Cost price<input type="number" min="0" step="0.01" value={f.cost_price} onChange={set('cost_price')} /></label>
      <label>Selling price<input type="number" min="0" step="0.01" value={f.selling_price} onChange={set('selling_price')} /></label>
      <label>Low stock threshold (blank = use default)<input type="number" min="0" value={f.low_stock_threshold} onChange={set('low_stock_threshold')} /></label>
      {err && <p className="error">{err}</p>}
      <button type="submit">Save</button>{' '}
      <Link to="/products">Cancel</Link>
    </form>
  );
}

export function Settings() {
  const [v, setV] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api('/settings').then((s) => setV(s.default_low_stock_threshold)).catch((e) => setMsg(e.message));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/settings', { method: 'PUT', body: { default_low_stock_threshold: v } });
      setMsg('Saved');
    } catch (e) {
      setMsg(e.message);
    }
  };
  return (
    <form onSubmit={save} className="card form">
      <h2>Settings</h2>
      <label>Default low stock threshold
        <input type="number" min="0" value={v} onChange={(e) => setV(e.target.value)} required />
      </label>
      <button type="submit">Save</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}