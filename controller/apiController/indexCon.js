const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const tokens = require("../../config/tokens");
const { admin } = require("../../config/fbConfig");
const Retailer = require("../../model/retailer");
const { parse } = require("path");

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});
module.exports = {
  idTokenVerify: async (req, res) => {
    try {
      const { idToken } = req.body;
      if (idToken && idToken !== "" && idToken !== undefined) {
        admin
          .auth()
          .verifyIdToken(idToken)
          .then((decodedToken) => {
            const uid = decodedToken.uid;
            return res
              .status(200)
              .json({ status: "success", data: decodedToken });
          })
          .catch((error) => {
            return res
              .status(203)
              .json({ status: "error", error: error.message });
          });
      } else {
        return res
          .status(203)
          .json({ status: "error", error: "Sorry! Something went wrong." });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  getNewTokens: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        let payload = null;
        payload = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // console.log(payload);
        if (payload !== null) {
          const whereCon = { id: payload.userId, is_deleted: "0" };
          const checkResult = await dbFunction.fetchData(
            USER_MASTER,
            "",
            "",
            "",
            whereCon
          );
          if (checkResult.length > 0) {
            if (checkResult[0].refresh_token === refreshToken) {
              const accessToken = tokens.createAccessToken(checkResult[0].id);
              const newRefreshToken = tokens.createRefreshToken(
                checkResult[0].id
              );
              const editData = {
                refresh_token: newRefreshToken,
              };
              const updatewhereCon = { id: payload.userId };
              await dbFunction.update(USER_MASTER, editData, updatewhereCon);
              return res.status(200).json({
                status: "success",
                accessToken: `Bearer ${accessToken}`,
                refreshToken: newRefreshToken,
              });
            } else {
              return res
                .status(203)
                .json({ status: "error", message: "Invalid refresh token" });
            }
          } else {
            return res
              .status(203)
              .json({ status: "error", message: "Invalid refresh token" });
          }
        } else {
          return res
            .status(203)
            .json({ status: "error", message: "Invalid refresh token" });
        }
      } else {
        return res
          .status(203)
          .json({ status: "error", message: "Invalid refresh token" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  },

  retailerRegistration: async (req, res) => {
    try {
      const {
        retailerName,
        addressLine1,
        addressLine2,
        state,
        pincode,
        country,
        email,
        phone,
        city,
        upi_id,
        gPayNo,
        password,
        website,
        profilePic,
        gstnNumber,
      } = req.body;
      if (
        retailerName &&
        retailerName !== "" &&
        addressLine1 &&
        addressLine1 !== "" &&
        addressLine2 &&
        addressLine2 !== "" &&
        state &&
        state !== "" &&
        pincode &&
        pincode !== "" &&
        country &&
        country !== "" &&
        email &&
        email !== "" &&
        phone &&
        phone !== "" &&
        city &&
        city !== "" &&
        password &&
        password !== ""
      ) {
        const checkRetailer = await Retailer.find({
          phone,
        });
        if (checkRetailer.length === 0) {
          const retailerUser = new Retailer({
            retailerName,
            addressLine1,
            addressLine2,
            state,
            pincode,
            country,
            phone,
            email,
            city,
            upi_id,
            gPayNo,
            password: await bcrypt.hash(password, 10),
            website,
            profilePic,
            gstnNumber,
          });
          const result = await retailerUser.save();
          const accessToken = tokens.createAccessToken(result._id);
          const refreshToken = tokens.createRefreshToken(result._id);
          await Retailer.findByIdAndUpdate(
            result._id,
            {
              refreshToken: refreshToken,
              updatedAt: Date.now(),
            },
            { new: true }
          );
          return res.status(200).json({
            status: "success",
            data: result,
            accessToken: accessToken,
            refreshToken: refreshToken,
          });
        } else {
          return res.status(400).json({
            status: "error",
            error: "Retailer's Phone or Email ID already exists",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Sorry! Parameter missing.",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  loginWithPhoneRetailer: async (req, res) => {
    try {
      const { phone } = req.body;
      if (phone && phone !== "") {
        const result = await Retailer.findOne({
          $or: [{ phone: phone }],
        });
        if (result) {
          // if (result.status === "A" || result.status === "P") {
          const accesstoken = tokens.createAccessToken(result._id);
          const refreshToken = tokens.createRefreshToken(result._id);
          await Retailer.findByIdAndUpdate(
            result._id,
            {
              refreshToken: refreshToken,
              updatedAt: Date.now(),
            },
            { new: true }
          );
          if (result.profilePic) {
            result.profilePic = await getSignedUrl(result.profilePic);
          }

          return res.status(200).json({
            status: "success",
            data: result,
            accessToken: accesstoken,
            refreshToken: refreshToken,
          });
        } else {
          return res
            .status(400)
            .json({ status: "error", error: "Sorry! No accounts found." });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Sorry! Please provide registered Phone no",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  retailerLogin: async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (phone && phone !== "" && password && password !== "") {
        const result = await Retailer.findOne({
          phone,
        });
        // console.log(result);
        if (result) {
          // if (result.status === "A" || result.status === "P") {
          const matchResult = await bcrypt.compare(password, result.password);
          if (matchResult === true) {
            const accesstoken = tokens.createAccessToken(result._id);
            const refreshToken = tokens.createRefreshToken(result._id);
            await Retailer.findByIdAndUpdate(
              result._id,
              {
                refreshToken: refreshToken,
                updatedAt: Date.now(),
              },
              { new: true }
            );
            if (result.profilePic) {
              result.profilePic = await getSignedUrl(result.profilePic);
            }

            const retailerrResult = await Retailer.findOne({
              _id: result._id,
            }).populate("products", "_id productName");
            // .populate("services", "_id serviceCategory");

            return res.status(200).json({
              status: "success",
              data: retailerrResult,
              accessToken: accesstoken,
              refreshToken: refreshToken,
            });
          } else {
            return res.status(400).json({
              status: "error",
              error: "Incorrect Username Or Password.",
            });
          }
          //}
          // else {
          //     return res.status(400).json({ status: 'error', error: "Sorry! account is still pending Or Temporarily blocked by administrator." });
          // }
        } else {
          return res.status(400).json({
            status: "error",
            error: "Sorry! No Retailer's account found.",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error:
            "Sorry! Please provide registered Email ID/Phone No and Password",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  editRetailerProfile: async (req, res) => {
    try {
      const {
        retailerName,
        email,
        password,
        addressLine1,
        addressLine2,
        state,
        pincode,
        city,
        userId,
        country,
        upi_id,
        gPayNo,
        website,
        gstnNumber,
      } = req.body;

      if (userId && userId !== "" && userId !== null && userId !== undefined) {
        const updateData = { updatedAt: Date.now() };
        if (email && email !== "" && email !== undefined && email !== "") {
          const checkUserEmail = await Retailer.findOne({
            $and: [{ _id: { $ne: userId } }, { $or: [{ email: email }] }],
          });
          if (checkUserEmail) {
            return res.status(400).json({
              status: "error",
              error: "Sorry! Email Id already registered.",
            });
          } else {
            updateData["email"] = email;
          }
        }
        if (req.files && req.files.profilePic) {
          const allowType = ["image/png", "image/jpeg", "image/jpg"];
          const uploadedFile = req.files.profilePic;
          updateData["profilePic"] = await fileUpload(
            uploadedFile,
            "profile-pic-" + userId,
            allowType
          );
        }
        if (retailerName && retailerName !== "" && retailerName !== undefined)
          updateData["retailerName"] = retailerName;

        if (password && password !== "" && password !== undefined)
          updateData["password"] = await bcrypt.hash(password, 10);

        if (country && gPayNo !== "" && country !== undefined)
          updateData["country"] = country;

        if (upi_id && upi_id !== "" && upi_id !== undefined)
          updateData["upi_id"] = upi_id;

        if (gPayNo && gPayNo !== "" && gPayNo !== undefined)
          updateData["gPayNo"] = gPayNo;

        if (website && website !== "" && website !== undefined)
          updateData["website"] = website;

        if (gstnNumber && gstnNumber !== "" && gstnNumber !== undefined)
          updateData["gstnNumber"] = gstnNumber;

        if (addressLine1 && addressLine1 !== "" && addressLine1 !== undefined)
          updateData["addressLine1"] = addressLine1;

        if (addressLine2 && addressLine2 !== "" && addressLine2 !== undefined)
          updateData["addressLine2"] = addressLine2;

        if (state && state !== "" && state !== undefined)
          updateData["state"] = state;

        if (pincode && pincode !== "" && pincode !== undefined)
          updateData["pincode"] = pincode;

        if (city && city !== "" && city !== undefined)
          updateData["city"] = city;

        const updateResult = await Retailer.findByIdAndUpdate(
          userId,
          updateData,
          {
            new: true,
          }
        );
        if (updateResult.profilePic) {
          updateResult.profilePic = await getSignedUrl(updateResult.profilePic);
        }
        if (updateResult) {
          return res
            .status(200)
            .json({ status: "success", data: updateResult });
        }
      } else {
        return res
          .status(400)
          .json({ status: "error", error: "Sorry! User Id missing..." });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  },

  deleteRetailerProfile: async (req, res) => {
    try {
      const phone = req.params.phone;
      if (phone && phone !== "" && phone !== null) {
        const checkUser = await Retailer.find({ $or: [{ phone: phone }] });
        if (checkUser.length) {
          await Retailer.remove(
            {
              phone: phone,
            },
            function (err, Retailer) {
              if (err) return res.send(err);
              return res.status(200).json({ message: "Retailer Deleted" });
            }
          );
        } else {
          return res
            .status(203)
            .json({ status: "error", error: "Retailer Not Found" });
        }
      } else {
        return res
          .status(203)
          .json({ status: "error", error: "Sorry! Something went wrong." });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  getAllRetailer: async (req, res) => {
    try {
      const result = await Retailer.find();

      console.log(result.length);
      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {}
  },
  addStoreLocation: async (req, res) => {
    try {
      const { longitude, latitude, retailerId } = req.body;
      if (retailerId && retailerId !== "") {
        if (longitude && longitude !== "" && latitude && latitude !== "") {
          const addStoreLocation = await Retailer.findByIdAndUpdate(
            { _id: retailerId },
            {
              $set: {
                storeLocation: {
                  type: "Point",
                  coordinates: [parseFloat(latitude), parseFloat(longitude)],
                },
              },
            },
            (err, updateDetails) => {
              if (err) {
                console.log(err);
                return res.send(err);
              }
              if (updateDetails) {
                //Get updated location
                Retailer.findOne(
                  {
                    _id: retailerId,
                  },
                  (error, updateLocation) => {
                    if (error) {
                      return res.status(400).send(error);
                    }
                    return res.status(200).send(updateLocation);
                  }
                );
              }
            }
          );
        } else {
          return res
            .status(400)
            .json({ status: "error", error: "latitude or longitude missing" });
        }
      } else {
        return res
          .status(400)
          .json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  },

  findNearbyStores: async (req, res) => {
    try {
      const { latitude, longitude, userId } = req.body;
      if (latitude && latitude !== "" && longitude && longitude !== "") {
        const stores = await Retailer.find({
          storeLocation: {
            $near: {
              $maxDistance: 5000,
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(latitude), parseFloat(longitude)],
              },
            },
          },
        });
        if (stores) {
          return res.status(200).json({ status: "Success", data: stores });
        } else {
          return res
            .status(404)
            .json({ status: "Success", message: "No nearby stores available" });
        }
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  },
};
async function getSignedUrl(keyName) {
  try {
    const s3 = new AWS.S3({
      signatureVersion: "v4",
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    });
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: keyName,
    };

    const headCode = await s3.headObject(params).promise();
    if (headCode) {
      const signedUrl = s3.getSignedUrl("getObject", params);
      return signedUrl;
    } else {
      throw new Error("Sorry! File not found");
    }
  } catch (error) {
    if (error.code === "NotFound" || error.code === "Forbidden") {
      throw new Error("Sorry! File not found");
    }
  }
}
async function fileUpload(requestFile, fileName, allowType) {
  try {
    return new Promise(function (resolve, reject) {
      const uploadedFile = requestFile;
      if (allowType.includes(uploadedFile.mimetype)) {
        let uploadedFileName = uploadedFile.name;
        const filenameSplit = uploadedFileName.split(".");
        const fileExtension = filenameSplit[filenameSplit.length - 1];
        uploadedFileName =
          fileName.toLowerCase().replace(" ", "-") +
          "-" +
          Date.now() +
          "." +
          fileExtension;
        fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
          const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: "images/" + uploadedFileName, // File name you want to save as in S3
            Body: uploadedData,
          };
          s3.upload(params, async (err, data) => {
            if (err) {
              return reject("Sorry! File upload failed. " + err.message);
            } else {
              resolve(data.Key);
            }
          });
        });
      } else {
        return reject("Sorry! Invalid File.");
      }
    });
  } catch (error) {
    return reject(error.message);
  }
}
