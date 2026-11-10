import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Login, Signup, Dashboard, Products, ProductForm, Settings } from './pages';
import './App.css';

const loggedIn = () => !!localStorage.getItem('token');

function Layout({ children }) {
  const nav = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };
  return (
    <>
      <header className="nav">
        <b>StockFlow</b>
        <Link to="/">Dashboard</Link>
        <Link to="/products">Products</Link>
        <Link to="/settings">Settings</Link>
        <button onClick={logout}>Log out</button>
      </header>
      <main className="page">{children}</main>
    </>
  );
}

const Private = ({ children }) =>
  loggedIn() ? <Layout>{children}</Layout> : <Navigate to="/login" />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Private><Dashboard /></Private>} />
        <Route path="/products" element={<Private><Products /></Private>} />
        <Route path="/products/new" element={<Private><ProductForm /></Private>} />
        <Route path="/products/:id" element={<Private><ProductForm /></Private>} />
        <Route path="/settings" element={<Private><Settings /></Private>} />
      </Routes>
    </BrowserRouter>
  );
}