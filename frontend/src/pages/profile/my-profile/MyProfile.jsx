import imageCompression from "browser-image-compression";
import { useEffect, useRef, useState } from "react";
import { CiEdit, CiUser } from "react-icons/ci";
import { RiDeleteBin7Line } from "react-icons/ri";
import { toast } from "sonner";
import Loader from "../../../components/loader/Loader";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../../../services/address";
import {
  changeProfileImage,
  checkEmail,
  checkUsername,
  myProfile,
  updateProfile,
} from "../../../services/user";
import "./MyProfile.css";

const MyProfile = () => {
  const fileRef = useRef(null);

  // information states
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  // address states
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

  // profile states
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = ["Information", "Favorites", "Orders", "Addresses", "Settings"];

  // ----------- Handlers ----------------
  const handleChange = (e) => {
    setAddressData({
      ...addressData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeInput = (e) => {
    if (e.target.name === "email") {
      try {
        checkEmail(e.target.value).then((res) => {
          setEmailAvailable(res.success);
        });
      } catch (error) {
        console.error(error);
      }
    }
    if (e.target.name === "username") {
      try {
        checkUsername(e.target.value).then((res) => {
          setUsernameAvailable(res.success);
        });
      } catch (error) {
        console.error(error);
      }
    }

    if (e.target.name === "username") setUsername(e.target.value);
    if (e.target.name === "firstname") setFirstname(e.target.value);
    if (e.target.name === "lastname") setLastname(e.target.value);
    if (e.target.name === "email") setEmail(e.target.value);
  };

  const handleUpdateProfile = async () => {
    let hasError = false;

    if (profileData.username !== username) {
      try {
        const checkRes = await checkUsername(username);
        if (!checkRes.success) {
          toast.error("Username already exists!");
          hasError = true;
        }
      } catch (error) {
        console.error(error);
        hasError = true;
      }
    }

    if (profileData.email !== email) {
      try {
        const checkRes = await checkEmail(email);
        if (!checkRes.success) {
          toast.error("Email already exists!");
          hasError = true;
        }
      } catch (error) {
        console.error(error);
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
      const data = await updateProfile(username, firstname, lastname, email);
      toast.success("Profile updated successfully!");
      if (data.user) setProfileData(data.user);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIconClick = () => {
    fileRef.current.click();
  };

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
      formData.append("image", compressedFile);

      const data = await changeProfileImage(formData);
      toast.success("Profile image updated successfully!");
      if (data.user) setProfileData(data.user);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile image.");
    }
  };

  // Adres seçildiğinde formu doldur
  const handleSelectedAddress = (address, index) => {
    setAddressData(address);
    setEditingIndex(index);
  };

  // Add / Update adres
  const handleAddOrUpdateAddress = async () => {
    try {
      setLoading(true);

      if (editingIndex !== null) {
        // Güncelleme
        const addressId = addresses[editingIndex].id;
        const data = await updateAddress(addressId, addressData);

        const updatedAddresses = [...addresses];
        updatedAddresses[editingIndex] = data.address;
        setAddresses(updatedAddresses);

        toast.success("Address updated successfully!");
        setEditingIndex(null);
      } else {
        // Yeni ekleme
        const data = await addAddress(addressData);
        setAddresses((prev) => [...prev, data.address]);
        toast.success("Address added successfully!");
      }

      // Formu temizle
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

  // ----------- useEffect ----------------
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

  if (loading) return <Loader />;

  // ----------- JSX ----------------
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

        {activeIndex === 0 && (
          <div className="information-container">
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
                    <div
                      className="item-settings"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <RiDeleteBin7Line />
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

        {activeIndex === 1 && (
          <div className="tab-section-container">Favorites</div>
        )}
        {activeIndex === 2 && (
          <div className="tab-section-container">Orders</div>
        )}
        {activeIndex === 3 && (
          <div className="tab-section-container">Addresses</div>
        )}
        {activeIndex === 4 && (
          <div className="tab-section-container">Settings</div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
