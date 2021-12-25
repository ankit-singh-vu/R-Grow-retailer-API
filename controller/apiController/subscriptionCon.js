const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const tokens = require("../../config/tokens");
const { admin } = require("../../config/fbConfig");
const Retailer = require("../../model/retailer");
const Razorpay = require("razorpay");
const crypto = require("crypto");

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SCERET,
});

module.exports = {
  createPlan: async (req, res) => {
    try {
      const params = {
        period: "yearly",
        interval: 1,
        item: {
          name: "gold",
          amount: 2000,
          currency: "INR",
          description: "Basic Plan",
        },
        notes: {
          notes_key_1: "BASIC PLAN",
        },
      };
      instance.plans.create(params).then((plan) => {
        if (plan) {
          return res.status(200).json({ status: "success", plan: plan });
        } else {
          throw new Error("Invalid subscriptions");
        }
        // return res.render('plan', { plan: plan })
      });
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  fetchPlan: async (req, res) => {
    try {
      // const params = {
      //   period: "yearly",
      //   interval: 1,
      //   item: {
      //     name: "gold",
      //     amount: 2000,
      //     currency: "INR",
      //     description: "Basic Plan",
      //   },
      //   notes: {
      //     notes_key_1: "BASIC PLAN",
      //   },
      // };
      // instance.plans.create(params).then((plan) => {
      //   if (plan) {
      //     return res.status(200).json({ status: "success", plan: plan });
      //   } else {
      //     throw new Error("Invalid subscriptions");
      //   }
      //   // return res.render('plan', { plan: plan })
      // });
      instance.plans.all().then(async (plans) => {
        return res.status(200).json({ status: "success", plans: plans });
      });
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  subscriptions: async (req, res) => {
    try {
      const { retailerId, plan_id } = req.body;
      var dt = new Date();

      var start_date = dt.setDate(dt.getDate() + 15);
      var end_date = dt.setDate(dt.getDate() + 365);

      const params = {
        plan_id: plan_id,
        total_count: 1,
        quantity: 1,
        customer_notify: 1,
        start_at: (start_date / 1000) | 0,
        expire_by: (end_date / 1000) | 0,
        // "addons":[
        //    {
        //       "item":{
        //          "name":"GST",
        //          "amount":1000,
        //          "currency":"INR"
        //       }
        //    }
        // ],
        // notes: {
        //   notes_key_1: "Tea, Earl Grey, Hot",
        //   notes_key_2: "Tea, Earl Grey… decaf.",
        // },
      };
      instance.plans.fetch(plan_id).then(async (plan) => {
        // console.log(plan.item.name);
        var plan_name = plan.item.name;

        instance.subscriptions
          .create(params)
          .then(async (subscription) => {
            if (subscription) {
              // console.log(subscription);
              await Retailer.findByIdAndUpdate(
                retailerId,
                {
                  plan_id: subscription.plan_id,
                  plan_name: plan_name,
                  subscription_status: true,
                  charge_at: subscription.charge_at,
                  start_at: subscription.start_at,
                  expire_by: subscription.end_at,
                  subscription_id: subscription.id,
                  updatedAt: Date.now(),
                },
                { new: true }
              );
              return res
                .status(200)
                .json({ status: "success", subscription: subscription });
            } else {
              throw new Error("Invalid subscriptions");
            }
          })
          .catch((err) => {
            return res.status(400).json({ status: "error", error: err });
          });
      });
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  verification: async (req, res) => {
    var hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SCERET);

    data = hmac.update(
      req.body.razorpay_payment_id + "|" + req.body.subscription_id
    );
    generated_signature = data.digest("hex");

    if (generated_signature === req.body.razorpay_signature) {
      await Retailer.findByIdAndUpdate(
        req.retailer_id,
        {
          subscription_status: true,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      return res
        .status(200)
        .json({ status: "success", message: "Subscribed Successfully" });
    } else {
      console.log("request is not legit");
    }
  },

  cancelSubscriptions: async (req, res) => {
    try {
      const { sub_id } = req.params;
      instance.subscriptions
        .cancel(sub_id, false)
        .then(async (result) => {
          return res.status(200).json({ status: "success", msg: result });
        })
        .catch((err) => {
          return res.status(404).json({ status: "error", error: err });
        });
    } catch (error) {
      return res.status(404).json({ error: error });
    }
  },
};
