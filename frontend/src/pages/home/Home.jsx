import { useContext, useEffect, useRef, useState } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import Loader from "../../components/loader/Loader";
import ProductCard from "../../components/productCard/ProductCard";
import AuthContext from "../../context/auth/AuthContext";
import {
  getAllProducts,
  getCategories,
  getConditions,
} from "../../services/product";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [condition, setCondition] = useState("all");
  const [conditions, setConditions] = useState([]);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  const loaderRef = useRef(null);

  const toggleShowCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
    setShowConditionDropdown(false);
  };

  const toggleShowConditionDropdown = () => {
    setShowConditionDropdown(!showConditionDropdown);
    setShowCategoryDropdown(false);
  };

  const closeDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowConditionDropdown(false);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const fetchAllProducts = async (reset = false) => {
    if (reset) setInitialLoading(true);
    setLoading(true);

    try {
      const params = { page: reset ? 1 : page, limit };
      if (category !== "all") params.category_id = category;
      if (condition !== "all") params.condition_id = condition;
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await getAllProducts(params);

      if (data.success) {
        setProducts(reset ? data.products : [...products, ...data.products]);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Ürünler alınamadı:", error);
    } finally {
      setLoading(false);
      if (reset) setInitialLoading(false);
    }
  };

  // Fetch categories & conditions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cats = await getCategories();
        const conds = await getConditions();
        setCategories(cats);
        setConditions(conds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Arama / filtre değiştiğinde
  useEffect(() => {
    setPage(1);
    fetchAllProducts(true);
  }, [category, condition, debouncedSearch]);

  // Page arttığında fetch
  useEffect(() => {
    if (page > 1) fetchAllProducts();
  }, [page]);

  // Infinite scroll
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
      <div className="filter-container">
        <div className="search-bar-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category */}
        <div
          className="category-filter-container"
          onClick={toggleShowCategoryDropdown}
        >
          <div className="category-value-box">
            <input
              placeholder="Select a category"
              readOnly
              value={
                category === "all"
                  ? ""
                  : categories.find((c) => c.id === category)?.name || ""
              }
            />
            {showCategoryDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`category-filter-dropdown ${
              showCategoryDropdown ? "show" : ""
            }`}
          >
            <ul>
              <li>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategory("all");
                    closeDropdowns();
                  }}
                >
                  All
                </span>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(c.id);
                      closeDropdowns();
                    }}
                  >
                    {c.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Condition */}
        <div
          className="condition-filter-container"
          onClick={toggleShowConditionDropdown}
        >
          <div className="condition-value-box">
            <input
              placeholder="Select a condition"
              readOnly
              value={
                condition === "all"
                  ? ""
                  : conditions.find((c) => c.id === condition)?.display_name ||
                    ""
              }
            />
            {showConditionDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`condition-filter-dropdown ${
              showConditionDropdown ? "show" : ""
            }`}
          >
            <ul>
              <li>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCondition("all");
                    closeDropdowns();
                  }}
                >
                  All
                </span>
              </li>
              {conditions.map((c) => (
                <li key={c.id}>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setCondition(c.id);
                      closeDropdowns();
                    }}
                  >
                    {c.display_name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="product-list">
        {products.length > 0 ? (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
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
