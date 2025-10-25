import { useEffect, useRef, useState } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { IoImagesSharp } from "react-icons/io5";
import { toast } from "sonner";
import Loader from "../../../components/loader/Loader";
import {
  createProduct,
  getCategories,
  getConditions,
  getStatuses,
} from "../../../services/product";
import "./AddProduct.css";

const AddProduct = () => {
  const imagesRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    condition_id: "",
    status_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({
    id: "",
    name: "",
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState({
    id: "",
    display_name: "",
  });
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleShowConditonDropdown = () =>
    setShowConditionDropdown(!showConditionDropdown);

  const toggleShowCategoryDropdown = () =>
    setShowCategoryDropdown(!showCategoryDropdown);

  const handleChangeCondition = (condition) => {
    setSelectedCondition(condition);
    setFormData({
      ...formData,
      condition_id: condition.id,
    });
    setShowConditionDropdown(false);
  };

  const handleChangeImages = (e) => {
    setImages(e.target.files);
  };

  const handleChangeCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      ...formData,
      category_id: category.id,
    });
    setShowCategoryDropdown(false);
  };

  const handleChangeFormData = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // ------------------- DEFAULT STATUS -------------------
      const activeStatus = statuses.find(
        (status) => status.display_name === "Active"
      );
      const statusId = activeStatus ? activeStatus.id : 1; // default 1

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);

      // ------------------- DEFAULTS FOR CATEGORY & CONDITION -------------------
      const categoryId = formData.category_id || 1;
      const conditionId = formData.condition_id || 1;

      data.append("category_id", categoryId);
      data.append("condition_id", conditionId);
      data.append("status_id", statusId);

      Array.from(images).forEach((file) => data.append("images", file));

      await createProduct(data);

      toast.success("Product created successfully!");
      setSubmitting(false);

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        category_id: "",
        condition_id: "",
        status_id: "",
      });
      setSelectedCategory({ id: "", name: "" });
      setSelectedCondition({ id: "", display_name: "" });
      imagesRef.current.value = null;
      setImages([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product!");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await getCategories();
        setCategories(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        setLoading(true);
        const res = await getConditions();
        setConditions(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true);
        const res = await getStatuses();
        setStatuses(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  if (loading) return <Loader />;

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.price &&
    formData.category_id &&
    formData.condition_id &&
    images.length > 0;

  return (
    <div className="add-product-container">
      <form onSubmit={handleCreateProduct} className="add-product-form">
        <div className="add-form-item">
          <label className="add-form-label">Product Title</label>
          <input
            placeholder="Product Title"
            name="title"
            onChange={handleChangeFormData}
            value={formData.title}
            className="add-form-input"
          />
        </div>

        <div className="add-form-item">
          <label className="add-form-label">Product Description</label>
          <textarea
            rows="5"
            placeholder="Product Description"
            name="description"
            onChange={handleChangeFormData}
            value={formData.description}
            className="add-form-input"
          />
        </div>

        <div className="add-form-item">
          <label className="add-form-label">Product Price</label>
          <input
            placeholder="Product Price"
            name="price"
            onChange={handleChangeFormData}
            value={formData.price}
            className="add-form-input"
            type="number"
          />
        </div>

        <div className="add-form-item">
          <label className="add-form-label">Product Category</label>
          <div className="dropdown-input" onClick={toggleShowCategoryDropdown}>
            <input
              placeholder="Product Title"
              name="category"
              value={selectedCategory.name}
              readOnly
            />
            {showCategoryDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`custom-dropdown ${showCategoryDropdown ? "show" : ""}`}
          >
            {categories.map((category) => (
              <div key={category.id} className="dropdown-item">
                <p onClick={() => handleChangeCategory(category)}>
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="add-form-item">
          <label className="add-form-label">Product Condition</label>
          <div className="dropdown-input" onClick={toggleShowConditonDropdown}>
            <input
              placeholder="Product Title"
              name="category"
              value={selectedCondition.display_name}
              readOnly
            />
            {showConditionDropdown ? <GoChevronUp /> : <GoChevronDown />}
          </div>
          <div
            className={`custom-dropdown ${showConditionDropdown ? "show" : ""}`}
          >
            {conditions.map((condition) => (
              <div key={condition.id} className="dropdown-item">
                <p onClick={() => handleChangeCondition(condition)}>
                  {condition.display_name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="add-form-item">
          <label>Product Images</label>
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            ref={imagesRef}
            onChange={handleChangeImages}
          />
          <div
            className="image-select-area"
            onClick={() => imagesRef.current.click()}
          >
            <IoImagesSharp />
          </div>
          <div className="images-preview">
            {Array.from(images).map((image, index) => (
              <div key={index} className="image-preview-item">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`preview-${index}`}
                  className="preview-img"
                />
                <button
                  type="button"
                  className="remove-img-btn"
                  onClick={() =>
                    setImages((prev) =>
                      Array.from(prev).filter((_, i) => i !== index)
                    )
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="add-form-item">
          <button
            className="submit-btn"
            disabled={!isFormValid || submitting}
            type="submit"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
