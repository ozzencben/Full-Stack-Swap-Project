import imageCompression from "browser-image-compression";
import { useContext, useEffect, useRef, useState } from "react";
import { CiEdit, CiUser } from "react-icons/ci";
import { MdOutlineStarPurple500, MdOutlineStarRate } from "react-icons/md";
import { RiDeleteBin7Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../../../components/loader/Loader";
import AuthContext from "../../../context/auth/AuthContext";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  setPrimaryAddress,
  updateAddress,
} from "../../../services/address";
import { getMyProducts, getUserFavorites } from "../../../services/product";
import {
  changeProfileImage,
  checkEmail,
  checkUsername,
  myProfile,
  updateProfile,
} from "../../../services/user";
import "./MyProfile.css";

const MyProfile = () => {
  const { user } = useContext(AuthContext);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  // --- States ---
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const [addressData, setAddressData] = useState({
    title: "",
    full_name: "",
    phone_number: "",
    country: "",
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    building_no: "",
    apartment_no: "",
    postal_code: "",
    additional_info: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [favorites, setFavorites] = useState([]);

  const [myProducts, setMyProducts] = useState([]);
  const tabs = ["Information", "Products", "Orders", "Favorites", "Settings"];

  // --- Handlers ---
  const handleChange = (e) => {
    setAddressData({ ...addressData, [e.target.name]: e.target.value });
  };

  const handleSetPrimaryAddress = (id) => {
    // 1. profileData.primary_address_id'yi güncelle
    setProfileData((prev) => ({
      ...prev,
      primary_address_id: id,
    }));

    // 2. backend'e request gönder
    setPrimaryAddress(id).catch((err) => {
      console.error(err);
      // hata durumunda eski veriyi geri çek
      getAddresses().then((res) => setAddresses(res.addresses));
      myProfile().then((data) => setProfileData(data.user));
    });
  };

  const handleChangeInput = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      checkEmail(value).then((res) => setEmailAvailable(res.success));
    }
    if (name === "username") {
      checkUsername(value).then((res) => setUsernameAvailable(res.success));
    }

    if (name === "username") setUsername(value);
    if (name === "firstname") setFirstname(value);
    if (name === "lastname") setLastname(value);
    if (name === "email") setEmail(value);
  };

  const handleUpdateProfile = async () => {
    let hasError = false;

    if (profileData.username !== username) {
      const checkRes = await checkUsername(username).catch(
        () => (hasError = true)
      );
      if (checkRes && !checkRes.success) {
        toast.error("Username already exists!");
        hasError = true;
      }
    }

    if (profileData.email !== email) {
      const checkRes = await checkEmail(email).catch(() => (hasError = true));
      if (checkRes && !checkRes.success) {
        toast.error("Email already exists!");
        hasError = true;
      }
    }

    if (hasError) return;

    const hasChanges =
      username !== profileData.username ||
      firstname !== profileData.firstname ||
      lastname !== profileData.lastname ||
      email !== profileData.email;

    if (!hasChanges) {
      toast.info("No changes detected.");
      return;
    }

    try {
      setIsUpdating(true);
      const data = await updateProfile({
        username,
        firstname,
        lastname,
        email,
      });

      toast.success("Profile updated successfully!");
      if (data.user) setProfileData(data.user);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIconClick = () => fileRef.current.click();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return toast.error("Please select an image file.");

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(selectedFile, options);
      const preview = URL.createObjectURL(compressedFile);
      setPreviewUrl(preview);

      const formData = new FormData();
      formData.append("profile_image", compressedFile); // key frontend/backend uyumlu

      const data = await changeProfileImage(formData);
      toast.success("Profile image updated successfully!");
      if (data.user) setProfileData(data.user);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile image.");
    }
  };

  const handleSelectedAddress = (address, index) => {
    setAddressData(address);
    setEditingIndex(index);
  };

  const handleAddOrUpdateAddress = async () => {
    try {
      setLoading(true);
      if (editingIndex !== null) {
        const addressId = addresses[editingIndex].id;
        const data = await updateAddress(addressId, addressData);
        const updatedAddresses = [...addresses];
        updatedAddresses[editingIndex] = data.address;
        setAddresses(updatedAddresses);
        toast.success("Address updated successfully!");
        setEditingIndex(null);
      } else {
        const data = await addAddress(addressData);
        setAddresses((prev) => [...prev, data.address]);
        toast.success("Address added successfully!");
      }
      setAddressData({
        title: "",
        full_name: "",
        phone_number: "",
        country: "",
        city: "",
        district: "",
        neighborhood: "",
        street: "",
        building_no: "",
        apartment_no: "",
        postal_code: "",
        additional_info: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      setLoading(true);
      await deleteAddress(addressId);
      setAddresses(addresses.filter((address) => address.id !== addressId));
      toast.success("Address deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete address.");
    } finally {
      setLoading(false);
    }
  };

  // --- useEffects ---
  useEffect(() => {
    const fetchUserFavorites = async () => {
      try {
        setLoading(true);
        const res = await getUserFavorites();
        setFavorites(res.favorites);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const res = await getAddresses();
        setAddresses(res.addresses);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        const data = await myProfile();
        setProfileData(data.user);
        setUsername(data.user.username || "");
        setFirstname(data.user.firstname || "");
        setLastname(data.user.lastname || "");
        setEmail(data.user.email || "");
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, []);

  useEffect(() => {
    const fetchAllMyProducts = async () => {
      try {
        setLoading(true);
        const res = await getMyProducts();
        setMyProducts(res.products);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchAllMyProducts();
  }, []);

  if (loading) return <Loader />;
  console.log("profile", profileData);

  // --- JSX ---
  return (
    <div className="my-profile-container">
      <div className="user-info-container">
        <div className="profile-image-container">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="profile-image" />
          ) : profileData?.profile_image ? (
            <img
              src={profileData.profile_image}
              alt="Profile"
              className="profile-image"
            />
          ) : (
            <div className="ci-user">
              <CiUser />
            </div>
          )}
          <div className="ci-edit">
            <input
              type="file"
              onChange={handleFileChange}
              ref={fileRef}
              accept="image/*"
              name="image"
            />
            <CiEdit onClick={handleIconClick} />
          </div>
        </div>
        <div className="info-text">
          <h4>
            {profileData?.firstname} {profileData?.lastname}{" "}
          </h4>
          <p>(@{profileData?.username})</p>
        </div>
      </div>

      <div className="profile-tab-container">
        <div className="profile-tabs">
          {tabs.map((tab, index) => (
            <p
              key={index}
              className={`tab-item ${index === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              {tab}
            </p>
          ))}
          <div
            className="tab-border"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>

        {/* Information Tab */}
        {activeIndex === 0 && (
          <div className="information-container">
            {/* Profile Inputs */}
            <div className="tab-section-container information-section">
              <div
                className={`tab-item ${
                  profileData.username !== username && !usernameAvailable
                    ? "error"
                    : ""
                }`}
              >
                <label>Username :</label>
                <input
                  value={username}
                  onChange={handleChangeInput}
                  name="username"
                />
              </div>

              <div className="tab-item">
                <label>First name :</label>
                <input
                  value={firstname}
                  onChange={handleChangeInput}
                  name="firstname"
                />
              </div>

              <div className="tab-item">
                <label>Last name :</label>
                <input
                  value={lastname}
                  onChange={handleChangeInput}
                  name="lastname"
                />
              </div>

              <div
                className={`tab-item ${
                  profileData.email !== email && !emailAvailable ? "error" : ""
                }`}
              >
                <label>Email :</label>
                <input
                  value={email}
                  onChange={handleChangeInput}
                  name="email"
                />
              </div>

              <div className="tab-item">
                <button onClick={handleUpdateProfile}>
                  {isUpdating ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>

            {/* Address Section */}
            <div className="tab-section-container address-section">
              <div className="my-addresses-container">
                <p className="my-addresses-title">My Addresses</p>
                {addresses.map((address, index) => (
                  <div
                    className="address-item"
                    key={index}
                    onClick={() => handleSelectedAddress(address, index)}
                  >
                    <p>{address.title}</p>
                    <div className="address-item-icons">
                      <div
                        className="item-settings"
                        onClick={() => handleSetPrimaryAddress(address.id)}
                      >
                        {profileData.primary_address_id === address.id ? (
                          <>
                            <span className="primary-address">
                              Primary Address
                            </span>
                            <MdOutlineStarPurple500
                              style={{
                                width: "20px",
                                height: "20px",
                                fill: "black",
                              }}
                            />
                          </>
                        ) : (
                          <MdOutlineStarRate
                            style={{ width: "20px", height: "20px" }}
                          />
                        )}
                      </div>
                      <div
                        className="item-settings"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <RiDeleteBin7Line />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address Form */}
              <div className="tab-item">
                <label>Title</label>
                <input
                  name="title"
                  value={addressData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="tab-item">
                <label>Address Owner</label>
                <input
                  name="full_name"
                  value={addressData.full_name}
                  onChange={handleChange}
                />
              </div>
              <div className="tab-item">
                <label>Phone Number</label>
                <input
                  type="number"
                  name="phone_number"
                  value={addressData.phone_number}
                  onChange={handleChange}
                />
              </div>
              <div className="tab-item-row">
                <div className="tab-item">
                  <label>Country</label>
                  <input
                    name="country"
                    value={addressData.country}
                    onChange={handleChange}
                  />
                </div>
                <div className="tab-item">
                  <label>City</label>
                  <input
                    name="city"
                    value={addressData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="tab-item-row">
                <div className="tab-item">
                  <label>District</label>
                  <input
                    name="district"
                    value={addressData.district}
                    onChange={handleChange}
                  />
                </div>
                <div className="tab-item">
                  <label>Neighborhood</label>
                  <input
                    name="neighborhood"
                    value={addressData.neighborhood}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="tab-item-row">
                <div className="tab-item">
                  <label>Building No</label>
                  <input
                    name="building_no"
                    value={addressData.building_no}
                    onChange={handleChange}
                  />
                </div>
                <div className="tab-item">
                  <label>Apartment No</label>
                  <input
                    name="apartment_no"
                    value={addressData.apartment_no}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="tab-item-row">
                <div className="tab-item">
                  <label>Street</label>
                  <input
                    name="street"
                    value={addressData.street}
                    onChange={handleChange}
                  />
                </div>
                <div className="tab-item">
                  <label>Postal Code</label>
                  <input
                    type="number"
                    name="postal_code"
                    value={addressData.postal_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="tab-item">
                <label>Additional Info</label>
                <textarea
                  rows={5}
                  name="additional_info"
                  value={addressData.additional_info}
                  onChange={handleChange}
                />
              </div>
              <div className="tab-item">
                <button onClick={handleAddOrUpdateAddress}>
                  {editingIndex !== null ? "Update Address" : "Add Address"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeIndex === 1 && (
          <div className="tab-section-container">
            <div className="my-products-wrapper">
              <div className="my-product-card-container">
                {myProducts?.map((product) => (
                  <div
                    key={product.id}
                    className="my-product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.images[0]}
                      alt="Product"
                      className="my-product-image"
                    />
                    <div className="my-product-text-box">
                      <p className="my-product-title">{product.title}</p>
                      <p className="my-product-favorite-count">
                        Favorited {product.favorite_count} time
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeIndex === 2 && (
          <div className="tab-section-container">Orders</div>
        )}

        {activeIndex === 3 && (
          <div className="tab-section-container">
            <div className="favorite-products-container">
              {favorites?.map((product) => (
                <div
                  className="favorite-product-card"
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img
                    src={product.images[0]}
                    alt="Product"
                    className="favorite-product-image"
                    loading="lazy"
                  />
                  <div className="favorite-product-text-box">
                    <p className="favorite-product-title">{product.title}</p>
                    <p className="favorite-product-favorite-count">
                      Favorited {product.favorite_count} time
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeIndex === 4 && (
          <div className="tab-section-container">Settings</div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
