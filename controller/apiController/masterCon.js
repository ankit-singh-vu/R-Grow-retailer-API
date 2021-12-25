const AWS = require("aws-sdk");
// const Driver = require("../../model/drivers");
const Retailer = require("../../model/retailer");
const Product = require("../../model/products");
const Service = require("../../model/service");

const ProductCategory = require("../../model/productCategory");
const fs = require("fs");

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});
module.exports = {
  checkPhoneNo: async (req, res) => {
    try {
      const phoneNo = req.params.phone;
      if (phoneNo && phoneNo !== "" && phoneNo !== null) {
        const checkUser = await Retailer.find({ $or: [{ phone: phoneNo }] });
        console.log(checkUser);
        if (checkUser.length === 0) {
          res.status(200).json({
            status: "success",
            message: "No retailer registered with this number",
          });
        } else {
          res
            .status(203)
            .json({ status: "error", error: "Already registered" });
        }
      } else {
        res
          .status(203)
          .json({ status: "error", error: "Sorry! Something went wrong." });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  addCategory: async (req, res) => {
    try {
      const { name } = req.body;
      // let imageName = "";
      // let signedImage = "";
      // if (req.files) {
      //   const allowType = ["image/png", "image/jpeg", "image/jpg"];
      //   if (req.files.image_file) {
      //     const uploadedFile = req.files.image_file;
      //     imageName = await fileUpload(uploadedFile, name, allowType);
      //     // signedImage = await getSignedUrl(imageName);
      //   }
      // }
      const category = new ProductCategory({
        name: name,
        // image: imageName !== "" ? imageName : null,
      });
      await category.save();
      return res
        .status(200)
        .json({ status: "success", message: "Category added successfully" });
    } catch (error) {
      return res.status(400).json({ status: "error", error: error });
    }
  },

  addProduct: async (req, res) => {
    try {
      const {
        productName,
        description,
        productCategory,
        hsnNumber,
        price,
        quantity,
        profitMargin,
        totalTaxableAmount,
        discount,
        gstValue,
        totalAmount,
        productImages,
        retailerId,
      } = req.body;
      // console.log();
      if (
        productName &&
        productName !== "" &&
        description &&
        description !== "" &&
        // req.files.productImages.length &&
        productCategory &&
        productCategory !== "" &&
        retailerId &&
        retailerId !== "" &&
        hsnNumber &&
        hsnNumber !== "" &&
        price &&
        price !== "" &&
        quantity &&
        quantity !== "" &&
        totalAmount &&
        totalAmount !== ""
      ) {
        var add_limit = 0;

        const checkReatiler = await Retailer.findById({
          _id: retailerId,
        });
        // console.log(checkReatiler.plan_name);

        if (checkReatiler.plan_name === "Gold") {
          add_limit = 25;
        }
        if (checkReatiler.plan_name === "Silver") {
          add_limit = 25;
        }
        if (checkReatiler.plan_name === "Basic") {
          add_limit = 25;
        }

        // return 0;
        // if (checkReatiler) {
        if (checkReatiler.plan_name === "Platinum") {
          const product = new Product({
            productName,
            description,
            productCategory,
            hsnNumber,
            price,
            quantity,
            profitMargin,
            discount,
            totalTaxableAmount,
            totalAmount,
            retailerId,
          });
          const data = await product.save();
          const reatilerById = await Retailer.findById(retailerId);
          reatilerById.products.push(product);
          await reatilerById.save();
          if (req.files && data) {
            const allowType = ["image/png", "image/jpeg", "image/jpg"];
            if (req.files.productImages) {
              const imagesFiles = req.files.productImages;
              if (imagesFiles.length === undefined) {
                const uploadResult = await fileUpload(
                  imagesFiles,
                  imagesFiles.name.substr(imagesFiles.name.length) +
                    retailerId.substr(retailerId.length - 4),
                  allowType
                );

                const updatedData = await Product.findByIdAndUpdate(
                  data._id,
                  {
                    $push: {
                      productImages: {
                        name: imagesFiles.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
                const Data = await Product.findById(data._id);
                return res.status(200).json({
                  status: "success",
                  data: Data,
                  message: "Product added successfully",
                });
              }
              // **bug:- if single file upload then imagesFiles.length showing undefined
              for (let i = 0; i < imagesFiles.length; i++) {
                const uploadedFile = imagesFiles[i];

                const uploadResult = await fileUpload(
                  uploadedFile,
                  productName + retailerId.substr(retailerId.length - 4),
                  allowType
                );

                const updatedData = await Product.findByIdAndUpdate(
                  data._id,
                  {
                    $push: {
                      productImages: {
                        name: uploadedFile.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
              }
            }
          }
          const updatedData = await Product.findById(data._id);
          return res.status(200).json({
            status: "success",
            data: updatedData,
            message: "Product added successfully",
          });
        } else {
          const productCount = await Product.find({
            retailerId: retailerId,
          }).countDocuments();
          if (productCount < add_limit) {
            const product = new Product({
              productName,
              description,
              productCategory,
              hsnNumber,
              price,
              quantity,
              profitMargin,
              discount,
              totalTaxableAmount,
              totalAmount,
              retailerId,
            });
            const data = await product.save();
            const reatilerById = await Retailer.findById(retailerId);
            reatilerById.products.push(product);
            await reatilerById.save();
            if (req.files && data) {
              const allowType = ["image/png", "image/jpeg", "image/jpg"];
              if (req.files.productImages) {
                const imagesFiles = req.files.productImages;
                if (imagesFiles.length === undefined) {
                  const uploadResult = await fileUpload(
                    imagesFiles,
                    imagesFiles.name.substr(imagesFiles.name.length) +
                      retailerId.substr(retailerId.length - 4),
                    allowType
                  );

                  const updatedData = await Product.findByIdAndUpdate(
                    data._id,
                    {
                      $push: {
                        productImages: {
                          name: imagesFiles.name,
                          // image: await getSignedUrl(uploadResult),
                          image: uploadResult,
                        },
                      },
                    },
                    { new: true }
                  );
                  const Data = await Product.findById(data._id);
                  return res.status(200).json({
                    status: "success",
                    data: Data,
                    message: "Product added successfully",
                  });
                }
                // **bug:- if single file upload then imagesFiles.length showing undefined
                for (let i = 0; i < imagesFiles.length; i++) {
                  const uploadedFile = imagesFiles[i];

                  const uploadResult = await fileUpload(
                    uploadedFile,
                    productName + retailerId.substr(retailerId.length - 4),
                    allowType
                  );

                  const updatedData = await Product.findByIdAndUpdate(
                    data._id,
                    {
                      $push: {
                        productImages: {
                          name: uploadedFile.name,
                          // image: await getSignedUrl(uploadResult),
                          image: uploadResult,
                        },
                      },
                    },
                    { new: true }
                  );
                }
              }
            }
            const updatedData = await Product.findById(data._id);
            return res.status(200).json({
              status: "success",
              data: updatedData,
              message: "Product added successfully",
            });
          } else {
            return res.status(200).json({
              status: "error",
              error: "Product Add Limit Exceed for your plan",
            });
          }
        }
      }
      // }
      else {
        return res
          .status(203)
          .json({ status: "error", error: "Missing Something" });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({ status: "error", error: error.message });
    }
  },
  getProducts: async (req, res) => {
    try {
      const { retailerId } = req.params;
      if (retailerId && retailerId !== "") {
        const retailerproducts = await Product.find({ retailerId });
        for (let i = 0; i < retailerproducts.length; i++) {
          for (let j = 0; j < retailerproducts[i].productImages.length; j++) {
            retailerproducts[i].productImages[j].image = await getSignedUrl(
              retailerproducts[i].productImages[j].image
            );
          }
        }

        return res
          .status(200)
          .json({ status: "success", data: retailerproducts });
      } else {
        return res
          .status(400)
          .json({ status: "error", error: "Retailer Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  linkUPI: async (req, res) => {
    try {
      const { retailer_id, upiID } = req.body;

      if (
        retailer_id &&
        retailer_id !== "" &&
        retailer_id !== null &&
        retailer_id !== undefined &&
        upiID &&
        upiID !== "" &&
        upiID !== null &&
        upiID !== undefined
      ) {
        const addUpi = await Retailer.findOneAndUpdate(
          { _id: retailer_id },
          {
            upi_id: upiID,
          }
        );
        if (addUpi) {
          return res.status(200).json({
            status: "Success",
            data: addUpi,
            message: "UPI ID added Successfully",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Sorry! Reatiler Id or UPI Id missing...",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  },
  getProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      if (productId && productId !== "") {
        const retailerproducts = await Product.findById({ _id: productId });
        for (let j = 0; j < retailerproducts.productImages.length; j++) {
          retailerproducts.productImages[j].image = await getSignedUrl(
            retailerproducts.productImages[j].image
          );
        }

        return res
          .status(200)
          .json({ status: "success", data: retailerproducts });
      } else {
        return res
          .status(400)
          .json({ status: "error", error: "Product Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  editProduct: async (req, res) => {
    try {
      const {
        productName,
        description,
        productCategory,
        hsnNumber,
        price,
        discount,
        profitMargin,
        quantity,
        gstValue,
        totalTaxableAmount,
        totalAmount,
        retailerId,
        productId,
      } = req.body;

      if (
        retailerId &&
        retailerId !== "" &&
        retailerId !== null &&
        retailerId !== undefined &&
        productId &&
        productId !== "" &&
        productId !== null &&
        productId !== undefined
      ) {
        const checkProduct = await Product.findOne({
          $and: [{ _id: productId }, { retailerId: retailerId }],
        });
        if (checkProduct) {
          const updateData = { updatedAt: Date.now() };

          if (productName && productName !== "" && productName !== undefined)
            updateData["productName"] = productName;
          if (description && description !== "" && description !== undefined)
            updateData["description"] = description;

          if (
            productCategory &&
            productCategory !== "" &&
            productCategory !== undefined
          )
            updateData["productCategory"] = productCategory;

          if (hsnNumber && hsnNumber !== "" && hsnNumber !== undefined)
            updateData["hsnNumber"] = hsnNumber;

          if (discount && discount !== "" && discount !== undefined)
            updateData["discount"] = discount;

          if (profitMargin && profitMargin !== "" && profitMargin !== undefined)
            updateData["profitMargin"] = profitMargin;

          if (price && price !== "" && price !== undefined)
            updateData["price"] = price;

          if (quantity && quantity !== "" && quantity !== undefined)
            updateData["quantity"] = quantity;

          if (gstValue && gstValue !== "" && gstValue !== undefined)
            updateData["gstValue"] = gstValue;

          if (
            totalTaxableAmount &&
            totalTaxableAmount !== "" &&
            totalTaxableAmount !== undefined
          )
            updateData["totalTaxableAmount"] = totalTaxableAmount;

          if (totalAmount && totalAmount !== "" && totalAmount !== undefined)
            updateData["totalAmount"] = totalAmount;

          const updateResult = await Product.findByIdAndUpdate(
            productId,
            updateData,
            {
              new: true,
            }
          );

          if (req.files && updateResult) {
            const allowType = ["image/png", "image/jpeg", "image/jpg"];
            if (req.files.productImages) {
              const imagesFiles = req.files.productImages;
              // console.log(imagesFiles.length);
              if (imagesFiles.length === undefined) {
                const uploadResult = await fileUpload(
                  imagesFiles,
                  imagesFiles.name.substr(imagesFiles.name.length) +
                    retailerId.substr(retailerId.length - 4),
                  allowType
                );

                const updatedData = await Product.findByIdAndUpdate(
                  updateResult._id,
                  {
                    $push: {
                      productImages: {
                        name: imagesFiles.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
                // console.log(data._id);
                const Data = await Product.findById(updateResult._id);
                // console.log(Data);
                return res.status(200).json({
                  status: "success",
                  data: Data,
                  message: "Product added successfully",
                });
              }
              // **bug:- if single file upload then imagesFiles.length showing undefined
              for (let i = 0; i < imagesFiles.length; i++) {
                const uploadedFile = imagesFiles[i];

                const uploadResult = await fileUpload(
                  uploadedFile,
                  productName + retailerId.substr(retailerId.length - 4),
                  allowType
                );

                const updatedData = await Product.findByIdAndUpdate(
                  updateResult._id,
                  {
                    $push: {
                      productImages: {
                        name: uploadedFile.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
              }
            }
          }
          const updatedData = await Product.findById(updateResult._id);
          // console.log(updateData);
          return res.status(200).json({ status: "success", data: updatedData }); // if (updateResult.profilePic) {
          //   updateResult.profilePic = await getSignedUrl(updateResult.profilePic);
          // }
        } else {
          return res.status(400).json({
            status: "error",
            error:
              "Sorry! No product found with given retailerId and productId",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Sorry! Reatiler Id or Product Id missing...",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      if (productId && productId !== "") {
        const retailerProduct = await Product.findByIdAndDelete({
          _id: productId,
        });

        await Retailer.findByIdAndUpdate(retailerProduct.retailerId, {
          $pull: {
            products: productId,
          },
        });

        return res
          .status(200)
          .json({ status: "success", message: "Product deleted" });
      }
      {
        return res
          .status(400)
          .json({ status: "error", error: "Product Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  //Services
  addServices: async (req, res) => {
    try {
      const {
        description,
        serviceName,
        hourlyRate,
        experience,
        hsnNumber,
        availibility,
        timeSlot_start,
        timeSlot_end,
        retailerId,
      } = req.body;
      if (
        description &&
        description !== "" &&
        serviceName &&
        serviceName !== "" &&
        retailerId &&
        retailerId !== "" &&
        hourlyRate &&
        hourlyRate !== "" &&
        experience &&
        experience !== "" &&
        hsnNumber &&
        hsnNumber !== "" &&
        availibility &&
        availibility !== "" &&
        timeSlot_start &&
        timeSlot_start !== "" &&
        timeSlot_end &&
        timeSlot_end !== ""
      ) {
        // const checkReatiler = await Retailer.findOne({
        //   retailerId,
        // });
        // if (checkReatiler) {
        const service = new Service({
          description,
          serviceName,
          hourlyRate,
          experience,
          hsnNumber,
          availibility,
          timeSlot_start,
          timeSlot_end,
          retailerId,
        });
        // console.log(service);
        const data = await service.save();
        // console.log(data);
        const reatilerById = await Retailer.findById(retailerId);
        // console.log(reatilerById);
        reatilerById.services.push(service);
        await reatilerById.save();

        if (req.files && data) {
          const allowType = ["image/png", "image/jpeg", "image/jpg"];
          if (req.files.serviceImages) {
            const imagesFiles = req.files.serviceImages;
            if (imagesFiles.length === undefined) {
              const uploadResult = await fileUpload(
                imagesFiles,
                imagesFiles.name.substr(imagesFiles.name.length) +
                  retailerId.substr(retailerId.length - 4),
                allowType
              );
              const updatedData = await Service.findByIdAndUpdate(
                data._id,
                {
                  $push: {
                    serviceImages: {
                      name: imagesFiles.name,
                      // image: await getSignedUrl(uploadResult),
                      image: uploadResult,
                    },
                  },
                },
                { new: true }
              );
              const Data = await Service.findById(data._id);
              return res.status(200).json({
                status: "success",
                data: Data,
                message: "Service added successfully",
              });
            }

            for (let i = 0; i < imagesFiles.length; i++) {
              const uploadedFile = imagesFiles[i];
              const uploadResult = await fileUpload(
                uploadedFile,
                uploadedFile.name.substr(uploadedFile.name.length) +
                  retailerId.substr(retailerId.length - 4),
                allowType
              );
              // console.log(uploadResult);
              const updatedData = await Service.findByIdAndUpdate(
                data._id,
                {
                  $push: {
                    serviceImages: {
                      name: uploadedFile.name,
                      // image: await getSignedUrl(uploadResult),
                      image: uploadResult,
                    },
                  },
                },
                { new: true }
              );
              // console.log(updatedData);
            }
          }
        }
        // console.log(updatedData);
        const updatedData = await Service.findById(data._id);
        return res.status(200).json({
          status: "success",
          data: updatedData,
          message: "Service added successfully",
        });
      }
      // }
      else {
        return res.status(203).json({
          status: "error",
          error: "Sorry! Something  misssing",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  getServices: async (req, res) => {
    try {
      const { retailerId } = req.params;
      if (retailerId && retailerId !== "") {
        const retailerServices = await Service.find({ retailerId });
        for (let i = 0; i < retailerServices.length; i++) {
          for (let j = 0; j < retailerServices[i].serviceImages.length; j++) {
            retailerServices[i].serviceImages[j].image = await getSignedUrl(
              retailerServices[i].serviceImages[j].image
            );
          }
        }
        return res
          .status(200)
          .json({ status: "success", data: retailerServices });
      }
      {
        return res
          .status(400)
          .json({ status: "error", error: "Retailer Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },

  editService: async (req, res) => {
    try {
      const {
        description,
        serviceName,
        hourlyRate,
        experience,
        hsnNumber,
        availibility,
        timeSlot_start,
        timeSlot_end,
        retailerId,
        serviceImages,
        serviceId,
      } = req.body;

      if (
        retailerId &&
        retailerId !== "" &&
        retailerId !== null &&
        retailerId !== undefined &&
        serviceId &&
        serviceId !== "" &&
        serviceId !== null &&
        serviceId !== undefined
      ) {
        const checkService = await Service.findOne({
          $and: [{ _id: serviceId }, { retailerId: retailerId }],
        });

        if (checkService) {
          const updateData = { updatedAt: Date.now() };

          if (description && description !== "" && description !== undefined)
            updateData["description"] = description;

          if (serviceName && serviceName !== "" && serviceName !== undefined)
            updateData["serviceName"] = serviceName;

          if (hsnNumber && hsnNumber !== "" && hsnNumber !== undefined)
            updateData["hsnNumber"] = hsnNumber;

          if (hourlyRate && hourlyRate !== "" && hourlyRate !== undefined)
            updateData["hourlyRate"] = hourlyRate;

          if (experience && experience !== "" && experience !== undefined)
            updateData["experience"] = experience;

          if (availibility && availibility !== "" && availibility !== undefined)
            updateData["availibility"] = availibility;

          if (
            timeSlot_start &&
            timeSlot_start !== "" &&
            timeSlot_start !== undefined
          )
            updateData["timeSlot_start"] = timeSlot_start;

          if (timeSlot_end && timeSlot_end !== "" && timeSlot_end !== undefined)
            updateData["timeSlot_end"] = timeSlot_end;

          const updateResult = await Service.findByIdAndUpdate(
            serviceId,
            updateData,
            {
              new: true,
            }
          );

          if (req.files && updateResult) {
            const allowType = ["image/png", "image/jpeg", "image/jpg"];
            if (req.files.serviceImages) {
              const imagesFiles = req.files.serviceImages;
              // console.log(imagesFiles.length);
              if (imagesFiles.length === undefined) {
                const uploadResult = await fileUpload(
                  imagesFiles,
                  imagesFiles.name.substr(imagesFiles.name.length) +
                    retailerId.substr(retailerId.length - 4),
                  allowType
                );
                const updatedData = await Service.findByIdAndUpdate(
                  updateResult._id,
                  {
                    $push: {
                      serviceImages: {
                        name: imagesFiles.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
                const Data = await Service.findById(updateResult._id);
                return res.status(200).json({
                  status: "success",
                  data: Data,
                  message: "Service added successfully",
                });
              }
              // **bug:- if single file upload then imagesFiles.length showing undefined
              for (let i = 0; i < imagesFiles.length; i++) {
                const uploadedFile = imagesFiles[i];
                // console.log(uploadedFile);

                const uploadResult = await fileUpload(
                  uploadedFile,
                  uploadedFile.name.substr(uploadedFile.name.length) +
                    retailerId.substr(retailerId.length - 4),
                  allowType
                );

                const updatedData = await Service.findByIdAndUpdate(
                  updateResult._id,
                  {
                    $push: {
                      serviceImages: {
                        name: uploadedFile.name,
                        // image: await getSignedUrl(uploadResult),
                        image: uploadResult,
                      },
                    },
                  },
                  { new: true }
                );
                // if (updatedData) {
                //   return res
                //     .status(200)
                //     .json({ status: "success", data: updatedData });
                // }
              }
            }
          }
          const updatedData = await Service.findById(updateResult._id);

          return res.status(200).json({ status: "success", data: updatedData }); // if (updateResult.profilePic) {
          //   updateResult.profilePic = await getSignedUrl(updateResult.profilePic);
          // }
        } else {
          return res.status(400).json({
            status: "error",
            error:
              "Sorry! No Service found with given retailerId and productId",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Sorry! Reatiler Id or Service Id missing...",
        });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  },

  getService: async (req, res) => {
    try {
      const { serviceId } = req.params;
      if (serviceId && serviceId !== "") {
        const retailerService = await Service.findById({ _id: serviceId });
        for (let j = 0; j < retailerService.serviceImages.length; j++) {
          retailerService.serviceImages[j].image = await getSignedUrl(
            retailerService.serviceImages[j].image
          );
        }

        return res
          .status(200)
          .json({ status: "success", data: retailerService });
      }
      {
        return res
          .status(400)
          .json({ status: "error", error: "Service Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },
  deleteService: async (req, res) => {
    try {
      const { serviceId } = req.params;
      if (serviceId && serviceId !== "") {
        const retailerService = await Service.findByIdAndDelete({
          _id: serviceId,
        });

        await Retailer.findByIdAndUpdate(retailerService.retailerId, {
          $pull: {
            services: serviceId,
          },
        });

        return res
          .status(200)
          .json({ status: "success", message: "Service deleted" });
      }
      {
        return res
          .status(400)
          .json({ status: "error", error: "Service Id missing" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
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
          // console.log(params);

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
