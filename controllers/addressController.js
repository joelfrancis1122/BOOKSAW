import Address from "../models/addressModel.js";

const loadAddAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.error(error);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, mobile, houseName, city, state, pinCode } = req.body;
    const address = new Address({
      userId: userId,
      name: name,
      mobile: mobile,
      houseName: houseName,
      city: city,
      state: state,
      pinCode: pinCode,
    });
    const savedAddress = await address.save();
    res.redirect("/loadProfile");
  } catch (error) {
    console.error(error);
  }
};

const addAddress1 = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, mobile, houseName, city, state, pinCode } = req.body;
    const address = new Address({
      userId: userId,
      name: name,
      mobile: mobile,
      houseName: houseName,
      city: city,
      state: state,
      pinCode: pinCode,
    });
    const savedAddress = await address.save();
    res.redirect("/loadCheckOut");
  } catch (error) {
    console.error(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressData = await Address.findById(req.query.id);
    res.render("editAddress", { addresses: addressData });
  } catch (error) {
    console.error(error);
  }
};

const loadEditAddress1 = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressData = await Address.findById(req.query.id);
    res.render("editAddressProfile", { addresses: addressData });
  } catch (error) {
    console.error(error);
  }
};

const updateAddress = async (req, res) => {
  try {
    const { name, mobile, houseName, city, state, pinCode } = req.body;
    const userId = req.session.user;
    const updated = await Address.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { name, mobile, houseName, city, state, pinCode } }
    );
    res.redirect("/loadCheckOut");
  } catch (error) {
    console.error(error);
  }
};

const updateAddress1 = async (req, res) => {
  try {
    const { name, mobile, houseName, city, state, pinCode } = req.body;
    const userId = req.session.user;
    const updated = await Address.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { name, mobile, houseName, city, state, pinCode } }
    );
    res.redirect("/loadProfile");
  } catch (error) {
    console.error(error);
  }
};

const removeAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const deletedAddress = await Address.findOneAndDelete({ _id: addressId });
    res.status(200).json({ message: "Address removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default {
  removeAddress,
  updateAddress1,
  updateAddress,
  loadEditAddress1,
  loadEditAddress,
  addAddress1,
  addAddress,
  loadAddAddress,
};
