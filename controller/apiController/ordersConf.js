const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const tokens = require("../../config/tokens");
const { admin } = require("../../config/fbConfig");
const Retailer = require("../../model/retailer");
const Orders = require("../../model/orders");
const Users = require("../../model/users");
module.exports = {
  fetchOrders: async (req, res) => {
    try {
      const retailersOrder = await Orders.find();
      if (retailersOrder === null) {
        res.status(200).json({
          status: "success",
          message: "No Orders Found",
        });
      } else {
        res.status(200).json({ status: "success", allOrders: retailersOrder });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  fetchAllOrders: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.find({
          retailerId: retailer_id,
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          res
            .status(200)
            .json({ status: "success", allOrders: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  fetchNewOrders: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.find({
          $and: [{ retailerId: retailer_id }, { order_status: "pending" }],
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No New Orders Found",
          });
        } else {
          res
            .status(200)
            .json({ status: "success", allOrders: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  fetchCompletedOrders: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.find({
          $and: [{ retailerId: retailer_id }, { order_status: "completed" }],
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Completed Orders Found",
          });
        } else {
          res
            .status(200)
            .json({ status: "success", allOrders: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  fetchRejectedOrders: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.find({
          $and: [
            { retailerId: retailer_id },

            {
              $or: [
                { order_status: "cancelled_by_customer" },
                { order_status: "cancelled_by_retailer" },
              ],
            },
          ],
        }).populate("orders.product");

        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Rejected Orders Found",
          });
        } else {
          res
            .status(200)
            .json({ status: "success", allOrders: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  fetchOrder: async (req, res) => {
    try {
      const { retailer_id, order_id } = req.body;
      if (retailer_id && retailer_id !== "" && order_id && order_id !== "") {
        const retailersOrder = await Orders.findOne({
          $and: [{ _id: order_id }, { retailerId: retailer_id }],
        })
          .populate("orders.product")
          .populate("userId", "name email phone");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          res.status(200).json({ status: "success", order: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  // completeOrder:async (res,res)={
  //   // const { retailer_id, order_id } = req.body;
  //   // if (retailer_id && retailer_id !== "" && order_id && order_id !== "") {
  //   //   const retailersOrder = await Orders.findOne({
  //   //     $and: [{ _id: order_id }, { retailerId: retailer_id }],
  //   //   })
  //   //     .populate("orders.product")
  //   //     .populate("userId", "name email phone");
  //   //   if (retailersOrder.length === 0) {
  //   //     res.status(200).json({
  //   //       status: "success",
  //   //       message: "No Orders Found",
  //   //     });
  //   //   } else {
  //   //     res.status(200).json({ status: "success", order: retailersOrder });
  //   //   }
  //   // } else {
  //   //   res.status(203).json({ status: "error", error: "retailerId missing" });
  //   // }
  //   // try {
  //   // } catch (error) {
  //   //   res.status(400).json({ status: "error", error: error.message });
  //   // }
  // },
  acceptOrder: async (req, res) => {
    try {
      const { retailer_id, order_id } = req.body;
      if (retailer_id && retailer_id !== "" && order_id && order_id !== "") {
        const retailersOrder = await Orders.findOne({
          $and: [{ _id: order_id }, { retailerId: retailer_id }],
        }).populate("orders.product");
        // console.log(retailersOrder);
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          const acceptedOrder = await Orders.findByIdAndUpdate(
            order_id,
            {
              order_status: "accepted_by_retailer",
            },
            { new: true }
          );
          res.status(200).json({ status: "success", order: acceptedOrder });
        }
      } else {
        res
          .status(203)
          .json({ status: "error", error: "retailerId or orderId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  declineOrder: async (req, res) => {
    try {
      const { retailer_id, order_id } = req.body;
      if (retailer_id && retailer_id !== "" && order_id && order_id !== "") {
        const retailersOrder = await Orders.findOne({
          $and: [{ _id: order_id }, { retailerId: retailer_id }],
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          const cancelOrder = await Orders.findByIdAndUpdate(
            order_id,
            {
              order_status: "cancelled_by_retailer",
            },
            { new: true }
          );
          res.status(200).json({ status: "success", order: cancelOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
  markAsPaid: async (req, res) => {
    try {
      const { retailer_id, order_id } = req.body;
      if (retailer_id && retailer_id !== "" && order_id && order_id !== "") {
        const retailersOrder = await Orders.findOne({
          $and: [{ _id: order_id }, { retailerId: retailer_id }],
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          const markAsPaid = await Orders.findByIdAndUpdate(
            order_id,
            {
              marked_as_paid: "Yes",
              paid_at: Date.now(),
            },
            {
              new: true,
            }
          );
          // const markAsPaid = await Orders.findById(order_id);
          if (markAsPaid) {
            return res
              .status(200)
              .json({ status: "success", order: markAsPaid });
          }
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  acceptedOrder: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.findOne({
          $and: [
            { retailerId: retailer_id },
            { order_status: "accepted_by_retailer" },
          ],
        }).populate("orders.product");
        if (retailersOrder === null) {
          res.status(200).json({
            status: "success",
            message: "No Orders Found",
          });
        } else {
          return res
            .status(200)
            .json({ status: "success", order: retailersOrder });
        }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
};
