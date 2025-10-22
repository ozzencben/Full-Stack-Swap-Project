import { useContext, useEffect, useRef, useState } from "react";
import Loader from "../../components/loader/Loader";
import ProductCard from "../../components/productCard/ProductCard";
import AuthContext from "../../context/auth/AuthContext";
import { getAllProducts } from "../../services/product";
import "./Home.css";

const Home = () => {
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");

  const loaderRef = useRef(null);

  const fetchAllProducts = async (reset = false) => {
    if (reset) setInitialLoading(true);
    setLoading(true);

    try {
      const params = {
        page: reset ? 1 : page,
        limit,
        category_id: category || undefined,
        condition_id: condition || undefined,
        status_id: status || undefined,
        search: search || undefined,
      };

      const data = await getAllProducts(params);

      if (data.success) {
        setProducts((prev) =>
          reset ? data.products : [...prev, ...data.products]
        );
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Ürünler alınamadı:", error);
    } finally {
      setLoading(false);
      if (reset) setInitialLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAllProducts(true);
  }, [category, condition, status, search]);

  useEffect(() => {
    if (page > 1) fetchAllProducts();
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading && page < totalPages) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, totalPages, page]);

  if (initialLoading) return <Loader />;

  return (
    <div className="home-container">
      <div className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAuthenticated={isAuthenticated}
            />
          ))
        ) : (
          <div className="no-products">No products found</div>
        )}
      </div>

      {loading && <div className="bottom-loader">Loading...</div>}

      <div ref={loaderRef} className="bottom-loader"></div>
    </div>
  );
};

export default Home;
