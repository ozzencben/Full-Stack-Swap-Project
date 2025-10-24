import { useEffect, useRef, useState } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { IoImagesSharp } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../../../components/loader/Loader";
import {
  getCategories,
  getConditions,
  getStatuses,
  updateProduct,
} from "../../../services/product";
import "./UpdateProduct.css";

const UpdateProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product } = location.state || {};
  const imagesRef = useRef(null);

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || "",
    category_id: product?.category_id || "",
    condition_id: product?.condition_id || "",
    status_id: product?.status_id || "",
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({
    id: product?.category_id || "",
    name: "",
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState({
    id: product?.condition_id || "",
    display_name: "",
  });
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({
    id: product?.status_id || "",
    display_name: "",
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown toggle
  const toggleCategoryDropdown = () =>
    setShowCategoryDropdown(!showCategoryDropdown);
  const toggleConditionDropdown = () =>
    setShowConditionDropdown(!showConditionDropdown);
  const toggleStatusDropdown = () => setShowStatusDropdown(!showStatusDropdown);

  const handleChangeFormData = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setFormData({ ...formData, category_id: category.id });
    setShowCategoryDropdown(false);
  };

  const handleSelectCondition = (condition) => {
    setSelectedCondition(condition);
    setFormData({ ...formData, condition_id: condition.id });
    setShowConditionDropdown(false);
  };

  const handleSelectStatus = (status) => {
    setSelectedStatus(status);
    setFormData({ ...formData, status_id: status.id });
    setShowStatusDropdown(false);
  };

  const handleNewImages = (e) => {
    setNewImages((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const removeNewImage = (file) => {
    setNewImages((prev) => prev.filter((img) => img !== file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateProduct(product.id, formData, newImages);
      toast.success("Product updated successfully!");
      navigate(`/product/${product.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product!");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(true);
        const [catRes, condRes, statRes] = await Promise.all([
          getCategories(),
          getConditions(),
          getStatuses(),
        ]);
        setCategories(catRes);
        setConditions(condRes);
        setStatuses(statRes);

        const categoryName =
          catRes.find((c) => c.id === product?.category_id)?.name || "";
        setSelectedCategory({
          id: product?.category_id || "",
          name: categoryName,
        });

        const conditionName =
          condRes.find((c) => c.id === product?.condition_id)?.display_name ||
          "";
        setSelectedCondition({
          id: product?.condition_id || "",
          display_name: conditionName,
        });

        const statusName =
          statRes.find((s) => s.id === product?.status_id)?.display_name || "";
        setSelectedStatus({
          id: product?.status_id || "",
          display_name: statusName,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();
  }, [product]);

  if (loading) return <Loader />;

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.price &&
    formData.category_id &&
    formData.condition_id &&
    formData.status_id;

  return (
    <div className="update-product-container">
      <form onSubmit={handleSubmit} className="update-product-form">
        <div className="update-form-item">
          <label className="update-form-label">Product Title</label>
          <input
            placeholder="Product Title"
            name="title"
            onChange={handleChangeFormData}
            value={formData.title}
            className="update-form-input"
          />
        </div>

        <div className="update-form-item">
          <label className="update-form-label">Product Description</label>
          <textarea
            rows="5"
            placeholder="Product Description"
            name="description"
            onChange={handleChangeFormData}
            value={formData.description}
            className="update-form-input"
          />
        </div>

        <div className="update-form-item">
          <label className="update-form-label">Product Price</label>
          <input
            type="number"
            placeholder="Product Price"
            name="price"
            onChange={handleChangeFormData}
            value={formData.price}
            className="update-form-input"
          />
        </div>

        {/* Category */}
        <div className="update-form-item">
          <label className="update-form-label">Category</label>
          <div
            className="update-dropdown-input"
            onClick={toggleCategoryDropdown}
          >
            <input value={selectedCategory.name} readOnly />
            {showCategoryDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`update-custom-dropdown ${
              showCategoryDropdown ? "show" : ""
            }`}
          >
            {categories.map((c) => (
              <div
                key={c.id}
                className="update-dropdown-item"
                onClick={() => handleSelectCategory(c)}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="update-form-item">
          <label className="update-form-label">Condition</label>
          <div
            className="update-dropdown-input"
            onClick={toggleConditionDropdown}
          >
            <input value={selectedCondition.display_name} readOnly />
            {showConditionDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`update-custom-dropdown ${
              showConditionDropdown ? "show" : ""
            }`}
          >
            {conditions.map((c) => (
              <div
                key={c.id}
                className="update-dropdown-item"
                onClick={() => handleSelectCondition(c)}
              >
                {c.display_name}
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="update-form-item">
          <label className="update-form-label">Status</label>
          <div className="update-dropdown-input" onClick={toggleStatusDropdown}>
            <input value={selectedStatus.display_name} readOnly />
            {showStatusDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`update-custom-dropdown ${
              showStatusDropdown ? "show" : ""
            }`}
          >
            {statuses.map((s) => (
              <div
                key={s.id}
                className="update-dropdown-item"
                onClick={() => handleSelectStatus(s)}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="update-form-item">
          <label>Existing Images</label>
          <div className="update-images-preview">
            {existingImages.map((img, idx) => (
              <div className="update-image-preview-item" key={idx}>
                <img src={img} alt={`existing-${idx}`} />
                <button
                  type="button"
                  className="update-remove-img-btn"
                  onClick={() => removeExistingImage(img)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label>New Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            ref={imagesRef}
            onChange={handleNewImages}
          />
          <div
            className="update-image-select-area"
            onClick={() => imagesRef.current.click()}
          >
            <IoImagesSharp />
          </div>
          <div className="update-images-preview">
            {newImages.map((file, idx) => (
              <div className="update-image-preview-item" key={idx}>
                <img src={URL.createObjectURL(file)} alt={`new-${idx}`} />
                <button
                  type="button"
                  className="update-remove-img-btn"
                  onClick={() => removeNewImage(file)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="update-form-item">
          <button
            className="update-submit-btn"
            type="submit"
            disabled={!isFormValid || submitting}
          >
            {submitting ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateProduct;
